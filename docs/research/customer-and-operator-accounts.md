# 사용자 계정과 운영자 계정의 분리

조사일은 2026-11-14이다. 사용자(스토어 고객)와 운영자(어드민 계정)를 한 계정 테이블에 역할 컬럼으로 함께 둘지, 테이블과 로그인을 따로 둘지 정하려고, 커머스 플랫폼, 웹 프레임워크와 인증 라이브러리, ID 플랫폼, 보안 지침이 어떻게 하는지 봤다.

전제: 스토어는 Next.js, 어드민은 `admin.` 서브도메인의 SPA([ADR 0005](../adr/0005-admin-as-spa.md))이고, API는 NestJS 하나와 PostgreSQL 하나다. 세션은 서버에 두고 쿠키로 식별한다. 운영자는 시드로 만들고 공개 가입이 없으며, 세분화된 권한도 없다.

## 표기와 방법

각 항목은 **소스**(공개 저장소 코드와 스키마), **공식 문서**, **추론**으로 구분한다. 소스는 GitHub API로 기본 브랜치 파일을 읽었고, 코드는 실행하지 않았다.

## 결론

- **백오피스가 따로 있는 커머스 플랫폼은 분리가 다수다.** Magento(`customer_entity`와 `admin_user`), Medusa(Customer 모듈과 User 모듈), Shopify(스토어별 고객 계정과 플랫폼 계정인 직원 계정), Spree(6.0에서 `spree_customers`와 `spree_admin_users`로 나눔)가 분리한다. 한 테이블을 쓰는 곳은 Saleor(`is_staff`), WooCommerce(WordPress `wp_users`와 역할), Solidus(`admin` 역할)다.
- **흐름은 분리 쪽으로 움직였다.** Spree는 한 사용자 모델에 역할을 붙이던 구조에서, 5.2부터 어드민 모델을 따로 두는 것을 기본으로 했고 6.0에서 고객과 어드민 테이블을 완전히 나눴다.
- **범용 웹 프레임워크의 기본값은 한 테이블이다.** Django는 `User.is_staff`, Devise 위키와 Better Auth admin 플러그인은 역할 컬럼을 가장 쉬운 길로 둔다. 다만 Laravel(가드와 프로바이더)과 Devise(여러 모델)는 테이블을 나누는 방식을 공식으로 지원한다.
- **ID 플랫폼은 직원과 고객을 다른 사용자 영역에 둔다.** Keycloak은 직원 realm과 고객 realm을 따로 만드는 예를 들고, Microsoft Entra는 고객용 외부 테넌트를 직원 테넌트와 별도로 만든다. Auth0는 테넌트를 사용자 "도메인" 하나로 보고, 직원과 고객은 보통 겹치지 않는다고 쓴다.
- **보안 지침은 테이블 구조를 직접 말하지 않는다.** OWASP는 보안 수준이 다른 애플리케이션을 같은 호스트에 두지 말 것, 쿠키 `Domain`을 넓게 잡지 말 것, 권한이 바뀌면 세션 ID를 새로 발급할 것, 고가치 애플리케이션은 유휴 만료를 짧게 할 것을 권한다. 운영자 세션을 사용자 세션과 다른 쿠키, 다른 만료 정책으로 두는 근거가 된다.
- **추론:** 오픈런은 **운영자를 별도 `operators` 테이블과 별도 세션 쿠키로 둔다.** 세션 저장 방식과 비밀번호 해시 같은 인프라는 공유한다. 근거는 아래 [오픈런에 주는 시사점](#오픈런에-주는-시사점추론)에 있다.

## 커머스 플랫폼

### Magento / Adobe Commerce — 분리

- **소스:** 고객은 `Magento/Customer` 모듈의 `customer_entity` 테이블("Customer Entity"), 어드민은 `Magento/User` 모듈의 `admin_user` 테이블("Admin User Table")과 비밀번호 이력용 `admin_passwords`에 둔다([Customer db_schema.xml](https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Customer/etc/db_schema.xml), [User db_schema.xml](https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/User/etc/db_schema.xml)).
- **소스:** 토큰 테이블 `oauth_token`도 `admin_id`와 `customer_id` 컬럼을 따로 둔다([Integration db_schema.xml](https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Integration/etc/db_schema.xml)).
- **소스:** 어드민 세션은 이름이 `admin`인 별도 세션 쿠키를 쓰고, 쿠키 경로를 어드민 경로로 좁힌다(`SESSION_NAME_ADMIN = 'admin'`, `setCookiePath($adminPath)`)([AdminConfig.php](https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Backend/Model/Session/AdminConfig.php)).

### Shopify — 분리

- **공식 문서:** 고객 계정은 스토어마다 있다. 기본 로그인은 이메일로 받은 6자리 일회용 코드이고 비밀번호가 없으며, 일치하는 고객 프로필이 없으면 자동으로 만든다. 로그인 세션은 최대 365일 유지된다([Customer accounts](https://help.shopify.com/en/manual/customers/customer-accounts)).
- **공식 문서:** 직원 계정은 Shopify 관리자에서 만드는 사용자 계정이고, 역할과 권한을 붙인다([Staff accounts](https://help.shopify.com/en/manual/your-account/staff-accounts)). 스토어 소유자와 직원은 Shopify 계정으로 로그인하며, 2단계 인증과 패스키를 쓰고, 조직이 보안 로그인을 강제할 수 있다([Logging in](https://help.shopify.com/en/manual/your-account/logging-in)).
- **추론:** 고객 계정은 스토어에 속하고 직원 계정은 플랫폼 계정이라, 정체성 저장소부터 다르다. 로그인 방식과 세션 수명도 다르다.

### Medusa v2 — 분리

- **소스:** 고객은 Customer 모듈의 `Customer`(`cus_` 접두사, 비회원 주문도 담도록 `has_account` 컬럼), 어드민은 User 모듈의 `user`(`user_` 접두사)로 다른 모듈, 다른 테이블이다([customer.ts](https://github.com/medusajs/medusa/blob/develop/packages/modules/customer/src/models/customer.ts), [user.ts](https://github.com/medusajs/medusa/blob/develop/packages/modules/user/src/models/user.ts)).
- **공식 문서:** 자격 증명은 Auth 모듈의 `AuthIdentity`가 따로 가지고, Auth 모듈은 사용자 같은 모델을 저장하지 않는다. 어떤 종류의 계정인지는 "actor type"(`customer`, `user`)으로 구분하고, 연결된 계정 ID를 `app_metadata`의 `{actor_type}_id`에 둔다. 라우트는 `authenticate("user", ...)`처럼 actor type으로 막는다([Auth identity and actor types](https://docs.medusajs.com/resources/commerce-modules/auth/auth-identity-and-actor-types)).
- **추론:** 프로필 테이블은 나누고 자격 증명 저장은 공유하는 중간형이다.

### Spree — 6.0에서 분리

- **공식 문서:** "Spree allows you to use a different model for the admin panel than the storefront (that's the default since Spree 5.2)."([Admin authentication](https://spreecommerce.org/docs/developer/admin/authentication))
- **소스:** 6.0(2026-10-27 출시)의 마이그레이션 `create_spree_customers_and_admin_users`가 `spree_customers`와 `spree_admin_users`를 만든다. 주석에 따르면 6.0 이전에도 어드민을 분리한 설치에는 `spree_admin_users`가 이미 있었고, `spree_customers`는 6.0에서 새로 생겼다. `Spree.user_class`는 `Spree.customer_class`로 이름이 바뀌어 deprecated됐고, `Spree.admin_user_class`가 따로 있다([마이그레이션](https://github.com/spree/spree/blob/main/spree/core/db/migrate/20260728000000_create_spree_customers_and_admin_users.rb), [core.rb](https://github.com/spree/spree/blob/main/spree/core/lib/spree/core.rb), [admin_user.rb](https://github.com/spree/spree/blob/main/spree/core/app/models/spree/admin_user.rb)).
- **소스:** `Spree::AdminUser`는 계정 잠금(`AccountLockout`), 비활성화(`AccountDeactivation`), 비밀번호 정책(`PasswordPolicy`)을 포함한다. 어드민 계정에만 붙는 보안 규칙이 모델 단위로 모인다.
- 릴리스 노트에는 분리 이유가 적혀 있지 않다([v6.0.0](https://github.com/spree/spree/releases/tag/v6.0.0)).

### Saleor — 한 테이블

- **소스:** `User` 하나에 `is_staff` 불리언을 두고, 권한은 Django `PermissionsMixin`과 그룹으로 준다. `customers()`는 `is_staff=False`에 더해 주문한 적 있는 직원도 포함하고, `staff()`는 `is_staff=True`다([account/models.py](https://github.com/saleor/saleor/blob/main/saleor/account/models.py)).
- **추론:** 한 사람이 직원이면서 고객일 수 있다는 것을 모델이 그대로 받아들인다. 대신 고객 목록 쿼리에서 직원을 걸러 내는 규칙이 생긴다.

### WooCommerce / WordPress — 한 테이블

- **공식 문서:** WooCommerce는 WordPress 사용자에 Customer와 Shop Manager 두 역할을 더한다. Shop Manager는 Customer 권한에 상점 관리 권한을 더한 것이다([Roles and capabilities](https://woocommerce.com/document/roles-capabilities/)). WordPress는 역할과 권한을 options 테이블의 `user_roles`에 저장한다([WordPress Roles and Capabilities](https://developer.wordpress.org/plugins/users/roles-and-capabilities/)).

### Solidus — 한 테이블

- **공식 문서:** Solidus는 이름이 자유로운 `User` 모델 하나를 요구하고 `Spree.user_class`로 지정한다([Custom authentication](https://guides.solidus.io/advanced-solidus/custom-authentication)).
- **소스:** `Spree::Role`이 사용자와 다대다로 연결되고, 이름이 `admin`인 역할에는 모든 권한(`SuperUser` 권한 세트)이 붙는다([role.rb](https://github.com/solidusio/solidus/blob/main/core/app/models/spree/role.rb), [super_user.rb](https://github.com/solidusio/solidus/blob/main/core/app/models/spree/permission_sets/super_user.rb)).
- Solidus는 Spree에서 갈라진 프로젝트라, Spree가 나누기 전 구조를 그대로 가지고 있다.

## 프레임워크와 인증 라이브러리

| 대상 | 기본 모양 | 분리 지원 |
|---|---|---|
| Django | `User.is_staff`: "Allows this user to access the admin site." `is_superuser`는 모든 권한([문서](https://docs.djangoproject.com/en/5.2/ref/contrib/auth/)) | 커스텀 사용자 모델은 하나만 지정한다 |
| Laravel | `App\Models\User` 하나를 쓰는 기본 프로바이더 | 가드와 프로바이더를 여러 개 둔다. "manage authentication for separate parts of your application using entirely separate authenticatable models or user tables", 예시가 `Auth::guard('admin')`, `auth:admin`이다. 가드와 프로바이더는 역할, 권한과 다른 개념이라고 구분한다([문서](https://laravel.com/docs/12.x/authentication)) |
| Rails Devise | 위키는 세 방법(별도 `Admin` 모델, `admin` 불리언, `role` enum)을 들고 불리언을 "The easiest way"라고 한다([위키](https://github.com/heartcombo/devise/wiki/How-To:-Add-an-Admin-Role)) | "Devise allows you to set up as many Devise models as you want." 모델마다 로그인 컨트롤러와 `authenticate_admin!` 같은 필터가 따로 생기고, 같은 동작을 공유하는 역할이면 역할 방식을 권한다([README](https://github.com/heartcombo/devise/blob/main/README.md)) |
| Better Auth admin 플러그인 | `user` 테이블에 역할(기본 `admin`, `user`)과 차단 필드를 더하고 `session` 테이블에 필드 하나를 더한다. 새 사용자는 `user` 역할([문서](https://www.better-auth.com/docs/plugins/admin)) | 플러그인은 한 테이블을 전제로 한다 |

**추론:** 범용 프레임워크는 "로그인한 사람 중 일부가 관리 화면도 본다"는 앱을 기본으로 놓는다. 고객과 운영자가 서로 다른 집단인 경우를 위해 Laravel과 Devise는 분리 방식을 일급으로 지원한다. Devise의 기준인 "같은 동작을 공유하면 역할, 아니면 모델"이 판단 기준으로 쓸 만하다.

## ID 플랫폼(직원 ID와 고객 ID)

- **Keycloak 공식 문서:** master realm은 다른 realm을 만들고 관리하는 데만 쓴다. "you might create a realm for the employees of your company and a separate realm for your customers."([Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/index.html))
- **Microsoft Entra 공식 문서:** 고객용 앱에는 직원 디렉터리가 있는 기존 테넌트와 별개인 외부 테넌트를 만든다. 외부 테넌트 안에서도 고객 계정과, 회사 계정으로 테넌트를 관리하는 관리자 계정을 구분한다([External tenant overview](https://learn.microsoft.com/en-us/entra/external-id/customers/overview-customers-ciam)).
- **Auth0 공식 문서:** "a tenant in Auth0 is intended to represent a "domain" of users." 조직은 흔히 여러 사용자 집단을 가지며 "typically little to no cross-over: employees, say, don't use the same applications as customers and vice-versa." 동시에 프로덕션 테넌트를 늘리면 관리할 테넌트가 빠르게 늘어나니 신중하라고 한다([B2C architecture](https://auth0.com/docs/get-started/architecture-scenarios/business-to-consumer/architecture)).
- **추론:** 업계 용어로 workforce identity(직원)와 CIAM(고객)은 다른 제품군이다. 가입 경로(셀프 가입과 관리자 발급), 인증 강도(MFA 강제 여부), 수명 주기(퇴사와 탈퇴)가 다르기 때문이다. 오픈런의 운영자는 workforce 쪽 성격이다.

## 보안 지침

- **OWASP Session Management Cheat Sheet:**
  - 쿠키 `Domain`은 설정하지 않아 발급한 서버에만 보내도록 하라고 권한다. `example.com`처럼 넓게 잡으면 한 서브도메인의 취약점으로 다른 서브도메인의 세션 ID가 새 나갈 수 있다.
  - "it is highly recommended not to run different web applications (especially from different security levels or scopes) on the same host."
  - 일반 사용자 역할에서 관리자 역할로 바뀌는 것 같은 권한 변경 뒤에는 세션 ID를 새로 발급해야 한다.
  - 유휴 만료는 고가치 애플리케이션이 2~5분, 위험이 낮은 애플리케이션이 15~30분이 흔하고, 모든 세션에 절대 만료를 둔다.
  - 프레임워크 기본 세션 쿠키 이름은 바꾸라고 권한다.
  - 출처: [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- **OWASP WSTG-CONF-05:** 관리자 인터페이스는 계정 발급, 데이터 변경, 설정 변경 같은 특권 기능을 가지며, 일반 사용자나 인증되지 않은 사람이 접근할 수 있는지 시험하라고 한다. 운영자 전용 인터페이스는 공개 인터넷에서 닿지 않는지도 확인하라고 한다. 테이블 구조에 대한 권고는 없다([WSTG 원문](https://github.com/OWASP/wstg/blob/master/document/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management/05-Enumerate_Infrastructure_and_Application_Admin_Interfaces.md)).
- **Better Auth 쿠키 문서:** 서브도메인 간 쿠키 공유는 필요할 때만 켜고, 도메인은 가장 좁게(`.example.com` 대신 `app.example.com`) 잡으라고 한다([Cookies](https://www.better-auth.com/docs/concepts/cookies)).

## 서브도메인과 세션 쿠키 범위

- **공식 문서(MDN):** `Domain`을 지정하지 않으면 쿠키는 발급한 호스트에만 가고 서브도메인에는 가지 않는다. 지정하면 그 도메인과 모든 서브도메인에 간다. 이름이 `__Host-`로 시작하는 쿠키는 `Secure`가 필수이고 `Domain`이 없어야 하며 `Path=/`여야 해서, 발급한 호스트에만 보내진다([MDN Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)).
- **공식 문서(web.dev):** site는 스킴과 eTLD+1이다. `www.example.com`과 `login.example.com`은 cross-origin이지만 same-site다([Same-site and same-origin](https://web.dev/articles/same-site-same-origin)).
- **소스:** 실제 구현 예로 Magento는 어드민 세션 쿠키 이름(`admin`)과 경로를 따로 두고, Django는 `SESSION_COOKIE_DOMAIN = None`이 기본이라 호스트 전용 쿠키를 쓴다([global_settings.py](https://github.com/django/django/blob/main/django/conf/global_settings.py)).
- **추론, 오픈런에 적용하면:**
  - 스토어 세션과 운영자 세션은 **이름이 다른 호스트 전용 쿠키**로 둔다(`Domain` 없음, 가능하면 `__Host-` 접두사, `HttpOnly`, `Secure`). 상위 도메인으로 쿠키를 공유하지 않는다.
  - 쿠키는 그것을 발급한 호스트에 묶인다. 어드민 SPA가 `admin.` 호스트 아래 경로(프록시)로 API를 부르면 운영자 쿠키는 `admin.` 호스트 전용이 되어 스토어로 가지 않는다. 스토어와 어드민이 같은 API 호스트(예: `api.`)를 직접 부르면 두 쿠키가 같은 호스트에 놓이므로, 쿠키 이름을 나누고 API에서 경로(`/admin/*`)별로 어느 쿠키를 읽을지 정해야 한다.
  - 스토어와 어드민은 same-site이므로 `SameSite`만으로는 스토어 쪽 페이지에서 어드민 API로 가는 요청을 막지 못한다. 어드민 API의 상태 변경 요청에는 `Origin` 검사나 CSRF 토큰이 따로 필요하다.

## 주고받는 논거

| | 한 테이블 + 역할 컬럼 | 테이블과 로그인 분리 |
|---|---|---|
| 내세우는 장점 | 구현이 가장 단순하다(Devise 위키의 "easiest way"). 한 사람이 고객이면서 직원인 경우를 그대로 표현한다(Saleor `customers()`). 인증 코드, 세션, 비밀번호 재설정이 하나다 | 고객 테이블과 운영자 테이블이 각자 필요한 컬럼과 관계만 가진다(Medusa, Spree 6.0). 운영자에게만 잠금, 비활성화, 비밀번호 정책, MFA, 짧은 세션을 건다(Spree `AdminUser`, Shopify 2단계 인증). 역할 검사 누락이나 가입 API의 역할 값 조작이 곧 관리자 권한 상승으로 이어지지 않는다(추론). 고객 목록에서 직원을 걸러 낼 필요가 없다 |
| 내세우는 단점 | 고객 쿼리마다 직원을 걸러야 한다. 운영자 전용 보안 정책을 행 단위 조건으로 걸어야 한다. 셀프 가입 경로와 관리자 계정이 같은 테이블이라 실수 하나가 권한 상승이 된다(추론) | 로그인, 세션, 비밀번호 처리 경로가 둘이 된다(Devise: 모델마다 컨트롤러가 따로). 한 사람이 둘 다면 계정이 둘이다. ID 플랫폼에서는 테넌트가 늘어 관리 부담이 커진다(Auth0) |

## 한국 예매 서비스

NOL 티켓(인터파크), YES24 티켓, 멜론티켓이 내부 운영자 계정을 어떻게 모델링하는지는 공개 자료를 찾지 못했다. 예술의전당 공지로 NOL 티켓 예매 시스템을 외부 공연장 사이트에서 쓴다는 것만 확인했고([예술의전당 공지](https://www.sac.or.kr/site/main/board/sacnews/308445)), 기획사나 운영자용 시스템의 로그인 방식은 확인하지 못했다.

## 오픈런에 주는 시사점(추론)

**권장: 운영자를 `operators` 테이블에 따로 두고, 운영자 세션은 사용자 세션과 다른 쿠키로 발급한다.** 세션 저장소, 비밀번호 해시, 세션 가드 구현은 공유하고, 가드가 어느 쿠키와 어느 테이블을 볼지만 다르게 한다(Laravel 가드, Medusa actor type과 같은 모양).

1. **실제 커머스 플랫폼 중 백오피스가 따로 있는 곳의 다수가 이렇게 한다.** Magento, Shopify, Medusa가 분리하고, 한 테이블이던 Spree도 6.0에서 나눴다. 프로젝트 원칙인 실제 서비스와 같은 모양에 맞는다.
2. **두 계정은 같은 동작을 공유하지 않는다.** 사용자는 셀프 가입, 약관 동의, 주문, 리뷰, 찜을 가지고, 운영자는 시드로만 생기며 이 중 어느 것도 갖지 않는다. Devise의 기준대로라면 모델을 나눌 경우다. 한 테이블이면 주문, 리뷰 같은 외래 키가 운영자 행도 가리킬 수 있게 되고, 사용자 목록마다 운영자를 걸러야 한다.
3. **세분화된 권한이 없어 분리 비용이 작다.** 역할 컬럼의 장점인 권한 확장성이 지금은 쓰이지 않는다. 반대로 분리하면 `operators`에 역할 컬럼을 둘 필요조차 없고, "운영자 테이블에 있으면 운영자"가 된다.
4. **보안상 경계가 분명해진다.** 사용자 가입 API로 운영자가 만들어질 길이 구조적으로 없다. 운영자 세션에 짧은 유휴 만료와 절대 만료를 따로 줄 수 있고(OWASP), 쿠키가 달라 스토어 세션으로 어드민 API를 부를 수 없다.
5. **어드민이 별도 서브도메인의 별도 앱이다.** 앱, 쿠키, 가드가 이미 갈라져 있어 테이블까지 나누는 것이 자연스럽다.

**한 테이블이 나은 조건:** 한 사람이 같은 계정으로 예매도 하고 운영도 해야 하거나, 운영자에게도 사용자 기능(주문, 리뷰)이 필요해지면 다시 검토한다. 기획사 같은 외부 파트너 계정이 생겨도 세 번째 계정 종류로 볼지 다시 정한다.

**결정하면 남길 곳:** 계정 분리와 세션 쿠키 범위는 되돌리기 어려운 결정이므로 ADR로 남긴다.

## 확인하지 못한 것

- Shopify 내부 데이터 모델. 공개 문서로는 계정 종류와 로그인 방식만 확인했다.
- Spree가 고객과 어드민을 나눈 이유. 릴리스 노트와 문서에 설명이 없다.
- Medusa v2가 store와 admin 세션을 같은 쿠키로 다루는지. 문서와 코드에서 확인하지 않았다.
- 한국 예매 서비스의 운영자 계정 구조.

## 출처

- Magento: [Customer db_schema.xml](https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Customer/etc/db_schema.xml), [User db_schema.xml](https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/User/etc/db_schema.xml), [Integration db_schema.xml](https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Integration/etc/db_schema.xml), [AdminConfig.php](https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Backend/Model/Session/AdminConfig.php)
- Shopify: [Customer accounts](https://help.shopify.com/en/manual/customers/customer-accounts), [Staff accounts](https://help.shopify.com/en/manual/your-account/staff-accounts), [Logging in](https://help.shopify.com/en/manual/your-account/logging-in)
- Medusa: [customer.ts](https://github.com/medusajs/medusa/blob/develop/packages/modules/customer/src/models/customer.ts), [user.ts](https://github.com/medusajs/medusa/blob/develop/packages/modules/user/src/models/user.ts), [Auth identity and actor types](https://docs.medusajs.com/resources/commerce-modules/auth/auth-identity-and-actor-types)
- Spree: [Admin authentication](https://spreecommerce.org/docs/developer/admin/authentication), [마이그레이션](https://github.com/spree/spree/blob/main/spree/core/db/migrate/20260728000000_create_spree_customers_and_admin_users.rb), [core.rb](https://github.com/spree/spree/blob/main/spree/core/lib/spree/core.rb), [admin_user.rb](https://github.com/spree/spree/blob/main/spree/core/app/models/spree/admin_user.rb), [v6.0.0 릴리스](https://github.com/spree/spree/releases/tag/v6.0.0)
- Saleor: [account/models.py](https://github.com/saleor/saleor/blob/main/saleor/account/models.py)
- WooCommerce/WordPress: [Roles and capabilities](https://woocommerce.com/document/roles-capabilities/), [WordPress Roles and Capabilities](https://developer.wordpress.org/plugins/users/roles-and-capabilities/)
- Solidus: [Custom authentication](https://guides.solidus.io/advanced-solidus/custom-authentication), [role.rb](https://github.com/solidusio/solidus/blob/main/core/app/models/spree/role.rb), [super_user.rb](https://github.com/solidusio/solidus/blob/main/core/app/models/spree/permission_sets/super_user.rb)
- Django: [django.contrib.auth](https://docs.djangoproject.com/en/5.2/ref/contrib/auth/), [global_settings.py](https://github.com/django/django/blob/main/django/conf/global_settings.py)
- Laravel: [Authentication](https://laravel.com/docs/12.x/authentication)
- Devise: [README](https://github.com/heartcombo/devise/blob/main/README.md), [How To: Add an Admin Role](https://github.com/heartcombo/devise/wiki/How-To:-Add-an-Admin-Role)
- Better Auth: [Admin plugin](https://www.better-auth.com/docs/plugins/admin), [Cookies](https://www.better-auth.com/docs/concepts/cookies)
- Keycloak: [Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/index.html)
- Microsoft Entra: [External tenant overview](https://learn.microsoft.com/en-us/entra/external-id/customers/overview-customers-ciam)
- Auth0: [B2C architecture](https://auth0.com/docs/get-started/architecture-scenarios/business-to-consumer/architecture)
- OWASP: [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [WSTG-CONF-05](https://github.com/OWASP/wstg/blob/master/document/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management/05-Enumerate_Infrastructure_and_Application_Admin_Interfaces.md)
- 쿠키: [MDN Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies), [web.dev Same-site and same-origin](https://web.dev/articles/same-site-same-origin)
- 한국 예매 서비스: [예술의전당 공지](https://www.sac.or.kr/site/main/board/sacnews/308445)
