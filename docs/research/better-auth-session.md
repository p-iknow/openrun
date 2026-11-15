# Better Auth의 세션 관리

조사일은 2026-11-14이다. NestJS + PostgreSQL API에 세션 인증을 직접 구현하되 Better Auth의 설계를 본뜨려고, Better Auth가 세션을 어떻게 만들고 검증하고 끝내는지 봤다. 세션 기반을 유지하면서 JWT의 장점(매 요청 DB 조회 생략)을 얻는 방법으로 쿠키 캐시를 자세히 봤다.

## 방법

공식 문서(`docs/content/docs/**.mdx`, better-auth.com/docs에 게시되는 원문)와 GitHub 소스만 읽었다. 블로그와 2차 자료는 보지 않았다.

- `better-auth/better-auth` 저장소 `main`, 커밋 `f39e6c66cc657e677b72828d0aff20b6ade2adae`(2026-11-13), `packages/better-auth` 버전 **1.7.23**.
- 의존 패키지는 이 커밋의 `pnpm-workspace.yaml` 카탈로그가 고정한 버전을 봤다. 서명 쿠키는 `better-call` **1.4.5**(npm 배포본 `dist/crypto.mjs`, `dist/context.mjs`와 GitHub `better-auth/better-call`의 `packages/better-call/src/`), 난수와 비밀번호 해시는 `@better-auth/utils` **v0.5.1** 태그.
- 아래 소스 경로는 `better-auth/better-auth` 저장소 기준이고, 줄 번호는 위 커밋 기준이다.

## 결론

- **세션은 DB 행이고, 쿠키에는 불투명 토큰만 담는다.** 토큰은 영문 대소문자와 숫자 62종에서 32자를 뽑은 문자열(약 190비트)이고, **DB에는 해시 없이 원문 그대로** `token` 컬럼(unique)에 저장한다.
- **세션 쿠키는 `토큰.HMAC서명` 형식으로 서명한다.** HMAC-SHA256(키는 `BETTER_AUTH_SECRET`), 서명은 base64(패딩 포함 44자), 전체를 URL 인코딩한다. 속성 기본값은 `HttpOnly`, `SameSite=Lax`, `Path=/`, HTTPS면 `Secure`와 `__Secure-` 접두사.
- **만료는 7일, 슬라이딩 갱신은 하루에 한 번.** 마지막 갱신 뒤 `updateAge`(1일)가 지난 요청에서 `expiresAt`을 `지금 + expiresIn`으로 다시 쓴다. `freshAge`(1일)는 `createdAt` 기준이고 갱신으로 늘지 않으며, 세션 목록 조회와 계정 연결 해제 같은 민감 작업에만 쓴다.
- **쿠키 캐시는 세션 행과 사용자 행 전체를 서명(또는 암호화)해 두 번째 쿠키(`session_data`)에 넣는다.** 기본은 꺼져 있고, 켜면 기본 `maxAge` 5분, 기본 전략 `compact`(base64url JSON + HMAC-SHA256)다. `jwt`(HS256), `jwe`(A256CBC-HS512 + HKDF)도 있다. 캐시가 유효하면 DB를 조회하지 않는다.
- **캐시가 있으면 폐기가 최대 `maxAge`만큼 늦는다.** 문서가 이 트레이드오프를 명시한다. 대신 비밀번호 변경, 세션 폐기 같은 민감 엔드포인트는 캐시를 무시하고 DB를 다시 읽는다(`sensitiveSessionMiddleware`).
- 로그인 쪽 기본값: 비밀번호는 scrypt(N=16384, r=16, p=1, 64바이트), 이메일 인증 토큰은 DB 행이 아닌 HS256 JWT(1시간), `/sign-in*`은 10초에 3회로 레이트 리밋(운영 모드에서만 기본 활성). CSRF는 토큰 없이 Origin 검사와 SameSite=Lax로 막는다.
- 관리자는 같은 `user` 테이블의 `role` 문자열 컬럼으로 구분한다(admin 플러그인). 관리자 계정과 고객 계정을 분리하는 기능은 없다.

## 1. 세션 테이블과 토큰

### 스키마

문서: [Session Management - Session table](https://www.better-auth.com/docs/concepts/session-management#session-table). 소스: `packages/core/src/db/get-tables.ts` 130-196행(`sessionTable`), `packages/core/src/db/schema/session.ts` 9-15행(`sessionSchema`).

| 컬럼 | 타입 | 제약 |
| --- | --- | --- |
| `id` | string | PK(`coreSchema`) |
| `token` | string | NOT NULL, **UNIQUE** |
| `userId` | string | NOT NULL, FK → `user.id` **ON DELETE CASCADE**, 인덱스 |
| `expiresAt` | date | NOT NULL |
| `createdAt` | date | NOT NULL, 기본 `now()` |
| `updatedAt` | date | NOT NULL, 수정 시 갱신 |
| `ipAddress` | string | NULL 허용 |
| `userAgent` | string | NULL 허용 |

플러그인이 컬럼을 더한다(예: admin 플러그인의 `impersonatedBy`). `session.additionalFields`로 앱 컬럼도 더할 수 있다.

### 토큰 생성

- `packages/better-auth/src/db/internal-adapter.ts` `createSession`(553행~)의 603행이 `token: generateId(32)`다.
- `generateId`(`packages/core/src/utils/id.ts`)는 `createRandomStringGenerator("a-z", "A-Z", "0-9")(32)`다.
- `@better-auth/utils` v0.5.1 `src/random.ts`는 `crypto.getRandomValues`로 바이트를 뽑고 `maxValid = floor(256/62)*62` 이상인 바이트를 버려 모듈로 편향을 없앤다.
- 결과: 영문 대소문자와 숫자 32자, 엔트로피 32 × log2(62) ≈ **190.5비트**. 인코딩은 base64나 hex가 아니라 영문 대소문자와 숫자로 된 문자열 그 자체다.
- `ipAddress`는 요청 헤더에서 뽑은 IP(기본 `X-Forwarded-For`), `userAgent`는 `user-agent` 헤더를 그대로 넣는다(같은 함수 590-591행).
- `rememberMe: false`로 로그인하면 `expiresAt`을 1일로 두고(597-599행) 쿠키를 세션 쿠키(`Max-Age` 없음)로 만든다.

### 저장 방식: 원문

`findSession(token)`(688행~)은 DB에서 `where token = <쿠키에서 꺼낸 값>`으로 바로 찾는다. 토큰을 해시하는 단계가 없으므로 **DB에는 토큰 원문이 들어 있다.** DB가 유출되면 유출된 토큰으로 바로 세션을 쓸 수 있다는 뜻이다. 쿠키 서명은 쿠키 위조를 막을 뿐 이 위험은 막지 못한다(서명 키를 가진 서버가 쿠키를 만들어 주기 때문).

## 2. 세션 쿠키

문서: [Cookies](https://www.better-auth.com/docs/concepts/cookies). 소스: `packages/better-auth/src/cookies/index.ts` `createCookieGetter`(45-118행), `getCookies`(120-155행), `setSessionCookie`(356-402행).

### 이름

- 형식은 `${cookiePrefix}.${이름}`이고 기본 접두사는 `better-auth`다. `advanced.cookiePrefix`, `advanced.cookies.<이름>.name`으로 바꾼다.
- Secure일 때는 앞에 `__Secure-`가 붙는다(`cookie-utils.ts` 34행 `SECURE_COOKIE_PREFIX`, `index.ts` 104행). 운영 환경 이름은 `__Secure-better-auth.session_token`이다.
- 쿠키 종류: `session_token`(세션 토큰), `session_data`(쿠키 캐시, 켰을 때만), `dont_remember`(rememberMe를 끈 표시, 서명됨), `account_data`(무상태 OAuth용).

### 속성 (103-115행)

| 속성 | 기본값 |
| --- | --- |
| `httpOnly` | `true` |
| `secure` | `advanced.useSecureCookies` > baseURL 설정의 protocol > `baseURL`이 `https://`로 시작하는지 > `NODE_ENV === "production"` 순으로 정한다(66-75행) |
| `sameSite` | `"lax"` |
| `path` | `"/"` |
| `domain` | 없음(호스트 전용). `crossSubDomainCookies`를 켰을 때만 설정 |
| `maxAge` | `session_token`은 `expiresIn`(7일), `session_data`는 `cookieCache.maxAge`(5분) |

덮어쓰기 우선순위는 기본값 < `advanced.defaultCookieAttributes` < 호출부 override < `advanced.cookies.<이름>.attributes`다.

### 서명

`setSessionCookie`는 `ctx.setSignedCookie(name, session.token, ctx.context.secret, ...)`를 부른다(377-386행). 구현은 better-call 1.4.5다.

- `packages/better-call/src/crypto.ts` `signCookieValue`: `HMAC-SHA256(secret, token)`을 표준 base64(패딩 포함)로 만들고 `${token}.${signature}`를 `encodeURIComponent`한다.
- `packages/better-call/src/context.ts` `getSignedCookie`: 마지막 `.` 기준으로 나누고, 서명이 44자이며 `=`로 끝나는지 본 뒤 WebCrypto `verify`로 검증한다. 서명이 틀리면 `false`, 쿠키가 없으면 `null`을 돌려준다.

정리하면 쿠키 값은 `<32자 토큰>.<44자 base64 HMAC>`(URL 인코딩)이다. 암호화는 하지 않는다.

## 3. 만료와 슬라이딩 갱신, 신선한 세션

문서: [Session Expiration](https://www.better-auth.com/docs/concepts/session-management#session-expiration), [Session Freshness](https://www.better-auth.com/docs/concepts/session-management#session-freshness).

### 기본값

`packages/better-auth/src/context/create-context.ts` 311-320행(`sessionConfig`):

- `expiresIn`: 7일(604800초)
- `updateAge`: 1일(86400초)
- `freshAge`: 1일(86400초). `0`이면 신선도 검사를 끈다.

### 갱신 시점

`packages/better-auth/src/api/routes/session.ts` `getSession`의 338-348행:

```ts
const sessionIsDueToBeUpdatedDate =
  session.session.expiresAt.valueOf() - expiresIn * 1000 + updateAge * 1000;
const shouldBeUpdated = sessionIsDueToBeUpdatedDate <= Date.now();
```

`expiresAt - expiresIn`은 마지막으로 만료를 정한 시각이므로, **마지막 갱신에서 `updateAge`가 지난 뒤 들어온 첫 요청**에서 갱신한다. 매 요청마다 쓰지 않도록 DB 쓰기를 하루 한 번으로 줄이는 장치다(주석에 NextAuth에서 가져왔다고 적혀 있다). 갱신하면(371-397행):

1. `expiresAt = 지금 + expiresIn`, `updatedAt = 지금`으로 DB 행을 고친다.
2. `setSessionCookie`로 `session_token` 쿠키를 같은 토큰으로 다시 내려 `Max-Age`를 늘리고, 쿠키 캐시도 새로 쓴다.
3. 행이 그새 지워져 업데이트가 실패하면 쿠키를 지우고 401을 낸다.

갱신하지 않는 경우:

- `dont_remember` 쿠키가 있을 때(rememberMe를 끈 세션, 313행)
- 요청에 `disableRefresh`가 있거나 `session.disableSessionRefresh: true`일 때
- `deferSessionRefresh: true`이고 GET일 때. GET은 읽기 전용으로 두고 `needsRefresh: true`만 돌려주며, 클라이언트가 POST `/get-session`으로 갱신한다(읽기 전용 복제본 대비).

DB에서 찾은 세션이 이미 만료됐으면 쿠키를 지우고 행도 지운 뒤 `null`을 돌려준다(292-307행).

### 신선한 세션(fresh session)

`freshSessionMiddleware`(session.ts 604-624행)는 `Date.now() - session.createdAt >= freshAge`면 403 `SESSION_NOT_FRESH`를 낸다. **기준이 `createdAt`이라 슬라이딩 갱신으로 늘어나지 않는다.** 즉 로그인한 지 오래된 세션은 다시 로그인해야 쓸 수 있는 작업을 가르는 장치다. 이 커밋에서 쓰는 곳:

- `GET /list-sessions`(session.ts 632행)
- `POST /unlink-account`(account.ts 478행)
- 비밀번호 없이 `deleteUser`를 부를 때(update-user.ts 581-590행)
- passkey 플러그인의 일부 경로(`packages/passkey/src/routes.ts` 221, 628행, 조건부)

비밀번호 변경은 현재 비밀번호를 받으므로 신선도 대신 `sensitiveSessionMiddleware`(DB 재조회)만 쓴다.

## 4. 쿠키 캐시 (`session.cookieCache`)

문서: [Cookie Cache](https://www.better-auth.com/docs/concepts/session-management#cookie-cache), [Cookie Cache Strategies](https://www.better-auth.com/docs/concepts/session-management#cookie-cache-strategies), [Stateless Session Management](https://www.better-auth.com/docs/concepts/session-management#stateless-session-management). 옵션 정의: `packages/core/src/types/init-options.ts` 1115-1180행 부근.

문서의 설명: "short-lived, signed cookie—similar to how JWT access tokens are used with refresh tokens". `session_token`이 리프레시 토큰, `session_data`가 액세스 토큰 역할이다.

### 옵션과 기본값

| 옵션 | 기본값 | 뜻 |
| --- | --- | --- |
| `enabled` | `false` | 켜야 동작한다 |
| `maxAge` | 300초(5분) | 캐시 쿠키와 페이로드의 유효 기간 |
| `strategy` | `"compact"` | `"compact"` \| `"jwt"` \| `"jwe"` |
| `refreshCache` | `false` | 만료 전에 DB 없이 캐시를 재발급(무상태 전용) |
| `version` | `"1"` | 문자열 또는 `(session, user) => string`. 바꾸면 기존 캐시가 모두 무효 |

### 담는 내용

`setCookieCache`(cookies/index.ts 157-276행)가 만드는 페이로드(187-192행):

```ts
{ session: filteredSession, user: filteredUser, updatedAt: Date.now(), version }
```

- `session`은 세션 행 전체(**`token` 포함**)와 추가 필드, `user`는 사용자 행에서 `returned: false` 필드를 뺀 것이다.
- `customSession` 플러그인이 붙이는 값은 캐시에 들어가지 않는다(문서 Caveats 3).
- 4050바이트를 넘으면 `session_data.0`, `.1`… 로 쪼갠다(`cookies/session-store.ts` 19-25행, 최대 100조각).

### 인코딩 전략

| 전략 | 구현 | 형식 |
| --- | --- | --- |
| `compact` | 227-242행 | `base64url(JSON{ session: 페이로드, expiresAt, signature })`(패딩 없음). `signature = HMAC-SHA256(secret, JSON({...페이로드, expiresAt}))`, base64url 패딩 없음. 내용은 누구나 읽을 수 있다 |
| `jwt` | 215-223행, `crypto/jwt.ts` `signJWT` 14-26행 | HS256 JWT, `exp = 지금 + maxAge`. jwt 플러그인에 `sessionCookieCache: true`를 주면 그 플러그인의 비대칭 키로 서명해 JWKS로 검증할 수 있다 |
| `jwe` | 207-214행, `crypto/jwt.ts` `symmetricEncodeJWT` | `alg: dir`, `enc: A256CBC-HS512`. 키는 secret에서 HKDF-SHA256(salt `"better-auth-session"`)로 64바이트를 뽑는다. 읽을 수도 고칠 수도 없다 |

문서 비교표는 크기 compact < jwt < jwe, 보안은 compact와 jwt가 "Good(signed)", jwe가 "Best(encrypted)"다. 셋 다 위조는 막고 차이는 크기, 가독성, JWT 표준 호환성이라고 적는다.

### 검증 흐름

`getSession`(session.ts 29행~)이 캐시를 읽는 순서다.

1. `session_token` 서명 쿠키를 먼저 검증한다(93-96행). **캐시가 켜져 있어도 이 쿠키가 없으면 바로 `null`**(98-100행). 캐시 쿠키만 훔쳐서는 쓸 수 없다.
2. `cookieCache.enabled`이고 쿼리에 `disableCookieCache`가 없으면 `decodeCookieCache`(cookies/index.ts 278-354행)로 서명/복호화를 검증한다. 실패하면 캐시 쿠키만 지운다(118-126행).
3. 다음 중 하나면 캐시를 버리고 DB로 간다(139-173행).
   - 캐시 안의 `session.token`이 `session_token` 쿠키 값과 다를 때
   - `version`이 현재 설정과 다를 때
   - 캐시 자체의 `expiresAt`(발급 + maxAge)이 지났거나, 캐시 안의 `session.expiresAt`이 지났을 때
4. 모두 통과하면 `refreshCache`가 `false`(DB가 있으면 항상 이 경우)일 때 **DB를 조회하지 않고 캐시 내용을 그대로 돌려준다**(178-200행).
5. 캐시를 쓰지 못하면 DB에서 세션을 찾고(292행), 3절의 슬라이딩 갱신을 판단한 뒤 `setCookieCache`로 캐시를 새로 발급한다(371-432행).

캐시 경로에서는 슬라이딩 갱신이 일어나지 않는다. 캐시가 5분마다 만료돼 DB 경로를 타므로, 그때 `updateAge` 조건을 본다.

### `refreshCache`

- 무상태(DB 없는) 구성 전용이다. `true`면 `maxAge`의 20%가 남았을 때, 객체면 `updateAge`초가 남았을 때 DB 없이 캐시와 `session_token` 쿠키를 다시 발급한다(session.ts 203-269행).
- `database`나 `secondaryStorage`가 있으면 경고를 남기고 강제로 끈다(create-context.ts 321-354행). 즉 **DB를 쓰는 구성에서 캐시는 만료되면 반드시 DB로 다시 확인한다.**

### 폐기 지연

문서 Callout 원문 요지: "When `cookieCache` is enabled, revoked sessions may remain active on other devices until the cookie cache expires (`maxAge`)." 서버는 다른 기기의 쿠키를 지울 수 없고, 캐시가 만료되거나 `disableCookieCache: true`일 때만 다시 확인하기 때문이다. 즉시 폐기가 중요하면 캐시를 끄거나, `maxAge`를 줄이거나(예: 60초), 민감한 작업에 `disableCookieCache: true`를 쓰라고 한다.

라이브러리 안에서는 이 지연을 다음처럼 줄인다.

- **민감 엔드포인트는 캐시를 무시한다.** `sensitiveSessionMiddleware`(session.ts 567-579행)는 `getAuthoritativeSessionFromCtx`(533-545행)로 `disableCookieCache: true`를 강제한다. `changePassword`, `setPassword`, `deleteUser`, `changeEmail`, `revokeSession(s)`, `revokeOtherSessions`, `linkSocialAccount`가 이걸 쓴다. 문서도 passkey 등록, 디바이스 인가, 2FA 검증, 소셜 계정 연결, 전화번호 변경은 캐시가 유효해도 DB를 확인한다고 적는다.
- 일반 엔드포인트의 `sessionMiddleware`(550-563행)는 캐시를 그대로 쓴다.
- 폐기를 요청한 기기 자신은 `deleteSessionCookie`(510-546행)가 `session_token`과 `session_data`를 모두 지우므로 즉시 로그아웃된다.
- 전체를 한 번에 끊으려면 `version`을 바꿔 배포한다(문서 "Versioning Stateless Sessions"). 함수형 `version`은 사용자별 값을 돌려줄 수 있지만, 검증 시 함수에 넘기는 인자가 캐시 안의 `session`과 `user`라서 DB의 최신 값을 반영하려면 함수 안에서 따로 조회해야 한다(140-153행).

### `disableCookieCache`

- 클라이언트 `getSession({ query: { disableCookieCache: true } })`나 서버 `auth.api.getSession({ query: { disableCookieCache: true } })`로 쓴다.
- 캐시를 건너뛰고 DB에서 읽은 뒤 캐시를 새로 발급한다(문서 원문: "force the server to fetch the session from the database and also refresh the cookie cache").
- `getSessionFromCtx`(459-517행)는 호출부의 `disableCookieCache`와 요청 쿼리를 OR로 합친다. 요청 쿼리로 강제된 엄격 검증을 풀지 못하게 하려는 것이다.

### 문서가 밝힌 트레이드오프

- 얻는 것: `getSession`마다 DB를 치지 않는다("Calling your database every time ... isn't ideal").
- 잃는 것: 폐기가 최대 `maxAge`만큼 늦는다. 캐시에 넣은 사용자 정보(역할 등)도 최대 `maxAge`만큼 낡을 수 있다(추론. 캐시 경로는 DB를 보지 않으므로).
- `compact`와 `jwt`는 내용(이메일, 세션 토큰 포함)을 base64로 읽을 수 있다. `HttpOnly`라 JS에서는 못 읽지만, 숨겨야 하면 `jwe`를 쓰라고 한다.

## 5. 로그아웃과 세션 폐기, 비밀번호 변경

문서: [Revoke Session](https://www.better-auth.com/docs/concepts/session-management#revoke-session) 이하, [Revoking Sessions on Password Change](https://www.better-auth.com/docs/concepts/session-management#revoking-sessions-on-password-change).

| 엔드포인트 | 소스 | 동작 |
| --- | --- | --- |
| `POST /sign-out` | `api/routes/sign-out.ts` 36행~ | 서명 쿠키에서 토큰을 꺼내 `deleteSession(token)`(95행), `deleteSessionCookie`로 쿠키를 모두 지운다(100행) |
| `POST /revoke-session` `{ token }` | session.ts 682-764행 | 토큰으로 세션을 찾고 **본인 세션일 때만** 지운다. 현재 세션이면 쿠키도 지운다 |
| `POST /revoke-sessions` | session.ts 766-820행 | `deleteUserSessions(userId)`로 본인 세션을 모두 지우고 쿠키도 지운다 |
| `POST /revoke-other-sessions` | session.ts 822-881행 | 만료 안 된 세션 중 현재 토큰이 아닌 것을 하나씩 지운다 |

- 폐기는 행 삭제다(`internal-adapter.ts` `deleteSession` 942행, `deleteUserSessions` 1021행). `secondaryStorage`와 `preserveSessionInDatabase`를 함께 쓸 때만 행을 남기고 `expiresAt`을 폐기 시각으로 바꾼다.
- `listSessions`가 클라이언트에 세션 `token`을 돌려주기 때문에 `revokeSession`은 토큰을 받는다.

비밀번호 변경(`POST /change-password`, `api/routes/update-user.ts` `changePassword` 156행~):

- 현재 비밀번호를 확인한다.
- `revokeOtherSessions: true`면 한 트랜잭션 안에서 **사용자의 세션을 모두 지우고**, 비밀번호를 바꾸고, **새 세션을 만들어** 쿠키로 내린다. 응답에는 새 `token`이 들어간다.
- 기본은 폐기하지 않는다. 클라이언트가 `revokeOtherSessions: true`를 보내야 한다.

비밀번호 재설정(분실): `emailAndPassword.revokeSessionsOnPasswordReset`(기본 `false`)이 켜져 있으면 재설정 토큰 소비, 세션 전체 삭제, 비밀번호 쓰기를 한 트랜잭션으로 한다(`utils/password.ts` `resetCredentialPassword` 40-60행). 재설정 토큰은 `generateId(24)`를 `verification` 테이블에 `reset-password:<token>`으로 넣고 기본 1시간 뒤 만료한다(`api/routes/password.ts` 125-136행).

## 6. 서브도메인 간 쿠키 (`crossSubDomainCookies`)

문서: [Cross Subdomain Cookies](https://www.better-auth.com/docs/concepts/cookies#cross-subdomain-cookies). 소스: cookies/index.ts 77-91, 110행.

- `advanced.crossSubDomainCookies: { enabled: true, domain?: string }`
- `domain`을 주면 그 값을, 안 주면 `baseURL`의 hostname을 모든 Better Auth 쿠키의 `Domain` 속성에 넣는다. 둘 다 없으면(동적 baseURL 제외) 시작할 때 에러를 낸다.
- 문서 권고: 꼭 필요할 때만 켜고, 가장 좁은 도메인을 쓰고, 믿을 수 없는 서브도메인을 조심하라. 다른 서브도메인의 요청은 `trustedOrigins`에도 넣어야 Origin 검사를 통과한다.

## 7. CSRF와 레이트 리밋

### CSRF

문서: [Security - CSRF Protection](https://www.better-auth.com/docs/reference/security#csrf-protection), [Trusted Origins](https://www.better-auth.com/docs/reference/security#trusted-origins). 소스: `packages/better-auth/src/api/middlewares/origin-check.ts`.

CSRF 토큰은 쓰지 않는다. 대신 다음을 겹친다.

1. **단순 요청을 피한다.** 상태를 바꾸는 요청에 `Content-Type: application/json` 같은 비단순 헤더를 요구한다. 이메일 로그인/가입처럼 폼(`x-www-form-urlencoded`)을 받는 경로는 아래 2, 4번으로 막는다.
2. **Origin 검사.** `originCheckMiddleware`(67행~)는 GET/OPTIONS/HEAD를 건너뛴다. `validateOrigin`(221-297행)은 **요청에 쿠키가 있을 때** `Origin`(없으면 `Referer`)을 `trustedOrigins`(기본으로 `baseURL`의 origin 포함)와 맞춰 보고, 없거나 `null`이거나 목록에 없으면 403을 낸다. `Origin: null`이어도 `Sec-Fetch-Site: same-origin`이면 요청 URL의 origin으로 판단한다. 와일드카드 패턴(`https://*.example.com`)을 지원한다.
3. **SameSite=Lax 쿠키**가 대부분의 교차 사이트 요청에 세션 쿠키를 싣지 않는다.
4. **첫 로그인 CSRF 방지**(`formCsrfMiddleware`, 303행~). 쿠키가 없는 로그인/가입 요청이 `Sec-Fetch-Site: cross-site` + `Sec-Fetch-Mode: navigate`면 막고, `Origin`/`Referer`가 있으면 `trustedOrigins`와 맞춰 본다. Fetch Metadata도 Origin도 없는 비브라우저 클라이언트만 통과시킨다.

이 검사는 `auth.handler`를 거친 HTTP 요청에만 적용되고, 서버에서 `auth.api.*`를 직접 부르면 건너뛴다고 문서에 적혀 있다.

### 레이트 리밋

문서: [Rate Limit](https://www.better-auth.com/docs/concepts/rate-limit). 소스: create-context.ts 357-365행, `api/rate-limiter/index.ts` `getDefaultSpecialRules` 440-469행.

- 기본 활성 여부는 `isProduction`이다(개발 모드에서는 꺼짐). 저장소는 `secondaryStorage`가 있으면 그것, 없으면 메모리다.
- 전역 규칙: 10초에 100회, IP 기준(기본 `X-Forwarded-For`).
- 특수 규칙:
  - `/sign-in*`, `/sign-up*`, `/change-password*`, `/change-email*`: **10초에 3회**
  - `/request-password-reset`, `/send-verification-email`, `/forget-password*`, email-otp 발송: **60초에 3회**
- 서버에서 `auth.api`로 직접 부르면 적용되지 않는다.

## 8. 이메일 인증 토큰과 비밀번호 해시

### 이메일 인증 토큰

소스: `api/routes/email-verification.ts` `createEmailVerificationToken`(17-43행), `sendVerificationEmailFn`(48행~), `verifyEmail`(306행 `jwtVerify`).

- **DB 행이 아니라 무상태 JWT다.** `{ email(소문자), updateTo?, userId }`를 HS256(`BETTER_AUTH_SECRET`)으로 서명한다(`crypto/jwt.ts` `signJWT`).
- 만료 기본값은 `emailVerification.expiresIn` = 3600초(1시간)(`init-options.ts` 764-768행).
- 링크는 `${baseURL}/verify-email?token=<jwt>&callbackURL=...`다.
- 따로 1회용 처리를 하지 않는다. 이미 `emailVerified`면 아무것도 바꾸지 않는 식으로 재사용을 무해하게 만든다(493행).
- `autoSignInAfterVerification`이면 인증 후 세션을 만든다(520행~).
- 비교: 비밀번호 재설정 토큰은 DB(`verification` 테이블) 행이고 1회용이다(5절).

### 비밀번호 해시

문서: [Security - Password Hashing](https://www.better-auth.com/docs/reference/security#password-hashing). 소스: `packages/better-auth/src/crypto/password.ts`, `@better-auth/utils` v0.5.1 `src/password.node.ts`.

- **scrypt**: Node에서는 `node:crypto.scrypt`, 지원하지 않는 런타임에서는 `@noble/hashes`.
- 파라미터: `N = 16384`, `r = 16`, `p = 1`, `dkLen = 64`, `maxmem = 128 × N × r × 2`. 비밀번호는 `NFKC`로 정규화한다.
- 솔트는 `randomBytes(16)`의 hex. 저장 형식은 `"<salt hex>:<key hex>"`다.
- 검증은 같은 솔트로 다시 계산해 hex 문자열을 `===`로 비교한다(상수 시간 비교가 아니다).
- `emailAndPassword.password.{hash, verify}`로 바꿀 수 있다.

## 9. admin 플러그인의 역할 모델

문서: [Admin](https://www.better-auth.com/docs/plugins/admin). 소스: `packages/better-auth/src/plugins/admin/schema.ts`, `admin.ts` 44-60행.

- `user` 테이블에 컬럼을 더한다: `role`(string, NULL 허용, 입력 불가), `banned`(boolean), `banReason`, `banExpires`. `session` 테이블에는 `impersonatedBy`를 더한다.
- 기본 역할은 `admin`, `user`이고 새 사용자는 `defaultRole`(`"user"`)이다. **역할이 여럿이면 `role`에 쉼표로 이어 붙인 문자열로 저장한다.** `adminRoles`(기본 `["admin"]`)에 든 역할이나 `adminUserIds`에 든 사용자가 관리자다.
- 권한은 `createAccessControl`로 리소스별 액션(`user: create, list, set-role, ban, impersonate…`, `session: list, revoke, delete`)을 역할에 묶는다.
- 차단된 사용자는 세션 생성 전 훅에서 막는다(admin.ts 90-120행). 사칭 세션은 기본 1시간이고 사용자의 `list-sessions` 응답에서 숨긴다(143-145행).
- **관리자 계정과 고객 계정을 분리하는 기능은 없다.** 같은 `user` 테이블, 같은 세션 쿠키, 같은 로그인 경로를 쓰고 `role`로만 가른다. 문서에도 분리 방법이 없다.

## 오픈런에 주는 시사점(추론)

- **토큰은 해시해서 저장하는 편이 낫다.** Better Auth는 원문을 저장한다. 직접 구현할 때는 쿠키에 원문을 두고 DB에는 `SHA-256(token)`을 두면, 조회는 그대로 한 번이고 DB 유출 시 세션 탈취를 막는다. Better Auth와 다르게 가는 결정이므로 ADR에 적는다.
- **쿠키 서명은 해시 저장과 겹치는 부분이 크다.** 토큰이 190비트 난수라 추측이 불가능하므로 HMAC 서명이 더하는 것은 DB 조회 전에 위조 쿠키를 거르는 정도다. 그대로 따라 해도 비용은 작다.
- **"JWT의 장점"은 쿠키 캐시로 얻는다.** 짧은 `maxAge`(1~5분)의 `compact` 캐시를 두고, 일반 조회는 캐시로, 비밀번호 변경, 세션 폐기, 결제/예매 확정 같은 민감 작업은 항상 DB 재조회(`sensitive` 경로)로 나누는 구조가 핵심이다. 캐시 검증 시 `session_token` 쿠키와 캐시 안 토큰이 같은지 확인하는 단계도 그대로 가져온다.
- 캐시에 세션 토큰 원문을 넣는 부분은 따라 하지 않아도 된다. 토큰 비교는 해시나 세션 id로 할 수 있다.
- 관리자를 고객과 분리하려면 Better Auth 모델(같은 테이블 + `role`)보다 더 나가야 한다. 별도 쿠키 이름과 경로, 짧은 만료, 별도 로그인 경로 같은 결정은 이 조사 범위 밖이다.

## 출처

공식 문서(better-auth.com, 원문은 저장소 `docs/content/docs/`):

- https://www.better-auth.com/docs/concepts/session-management (`concepts/session-management.mdx`)
- https://www.better-auth.com/docs/concepts/cookies (`concepts/cookies.mdx`)
- https://www.better-auth.com/docs/reference/security (`reference/security.mdx`)
- https://www.better-auth.com/docs/concepts/rate-limit (`concepts/rate-limit.mdx`)
- https://www.better-auth.com/docs/plugins/admin (`plugins/admin.mdx`)

소스(`https://github.com/better-auth/better-auth/blob/f39e6c66cc657e677b72828d0aff20b6ade2adae/` 기준):

- `packages/core/src/db/get-tables.ts`, `packages/core/src/db/schema/session.ts`
- `packages/core/src/utils/id.ts`
- `packages/core/src/types/init-options.ts`
- `packages/better-auth/src/db/internal-adapter.ts`
- `packages/better-auth/src/cookies/index.ts`, `cookies/cache.ts`, `cookies/cookie-utils.ts`, `cookies/session-store.ts`
- `packages/better-auth/src/crypto/jwt.ts`, `crypto/password.ts`
- `packages/better-auth/src/context/create-context.ts`
- `packages/better-auth/src/api/routes/session.ts`, `sign-out.ts`, `update-user.ts`, `password.ts`, `email-verification.ts`, `account.ts`
- `packages/better-auth/src/utils/password.ts`
- `packages/better-auth/src/api/middlewares/origin-check.ts`
- `packages/better-auth/src/api/rate-limiter/index.ts`
- `packages/better-auth/src/plugins/admin/schema.ts`, `plugins/admin/admin.ts`

의존 패키지:

- better-call 1.4.5: https://github.com/better-auth/better-call `packages/better-call/src/crypto.ts`, `src/context.ts`(npm 배포본 `dist/crypto.mjs`, `dist/context.mjs`로 확인)
- @better-auth/utils v0.5.1: https://github.com/better-auth/utils/tree/v0.5.1 `src/random.ts`, `src/password.node.ts`
