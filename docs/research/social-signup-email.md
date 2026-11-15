# 소셜 가입에서 이메일 다루기

조사일은 2026-11-16이다. 1.4a에서 이메일 가입자는 가입 화면 안에서 6자리 인증번호로 이메일을 확인한 뒤에 계정을 만들기로 했다(`docs/research/signup-email-verification.md`, #70 "이메일 인증"). 1.4b에서 Google과 카카오 로그인을 더하면서, 소셜로 가입할 때도 우리가 직접 이메일을 인증해야 하는지와 제공자가 준 이메일을 어떻게 다룰지 봤다.

## 방법

1차 자료만 읽었다.

- Google: developers.google.com의 OpenID Connect 문서와 ID 토큰 검증 문서.
- 카카오: developers.kakao.com의 카카오 로그인 문서(REST API, 설정하기, 이해하기, 활용하기).
- Better Auth: `better-auth/better-auth` 저장소, 커밋 `f39e6c66cc657e677b72828d0aff20b6ade2adae`, `packages/better-auth` 1.7.23(`better-auth-session.md`와 같은 기준). 줄 번호는 이 커밋 기준이다.
- 예매 서비스(NOL, YES24, 멜론티켓): 공개 문서가 없어서 카카오 로그인의 동의 화면을 봤다. 멜론은 사용자가 직접 로그인해 동의 화면을 열고 화면을 공유했다(동의하지 않음). NOL과 YES24는 보지 못했다.

## 결론

- **Google은 `email` scope를 요청하면 ID 토큰에 `email`과 `email_verified`를 넣는다.** `@gmail.com`이거나 `email_verified`가 true이고 `hd`가 있으면(Workspace) Google이 그 주소를 보증한다. 다른 도메인 주소는 처음 가입할 때 확인했을 뿐이고 그 뒤 소유자가 바뀌었을 수 있다고 Google 스스로 적는다.
- **카카오는 `kakao_account.email`과 함께 `is_email_valid`, `is_email_verified`, `email_needs_agreement`를 준다.** 이메일 동의항목(`account_email`)은 필수, 선택, 이용 중 동의로 둘 수 있지만, 비즈 앱(또는 테스트 앱)이어야 하고 권한이 필요한 항목은 비즈 앱 전환과 비즈니스 정보 심사를 거쳐야 한다. 선택 동의면 이메일이 아예 오지 않을 수 있다.
- **Better Auth는 제공자의 인증 여부를 그대로 `user.emailVerified`에 넣는다.** 카카오는 `is_email_valid && is_email_verified`일 때만 인증으로 본다. 이메일이 없으면 가입을 거부한다(`email_not_found`).
- **같은 이메일의 기존 사용자가 있으면 조건을 모두 만족할 때만 자동으로 연결한다.** 제공자 이메일이 인증됐거나(또는 `trustedProviders`에 있거나), 기존 사용자의 이메일도 인증돼 있어야 한다(`requireLocalEmailVerified` 기본 true). 하나라도 어긋나면 `account not linked`로 거부한다.

## 4. 예매 서비스의 카카오 가입

- **멜론(멜론티켓):** 카카오 로그인 동의 화면이 요청하는 항목은 필수 "카카오계정(전화번호)"와 선택 "카카오톡 채널 추가 상태 및 내역", 선택 멜론 채널 친구 추가·광고 메시지 수신뿐이다. **이메일은 요청하지 않는다.** 멜론은 카카오 가입 사용자의 연락처로 이메일이 아니라 카카오계정의 전화번호를 받는다(2026-11-16 확인, 동의 화면).
  - 필수 항목의 상세("카카오 개인정보 제3자 제공 동의")는 제공받는 자 Kakao Entertainment Corp., 필수 제공 항목 "카카오계정(전화번호)", 제공 목적 "멜론 서비스 내 이용자 식별, 회원관리 및 서비스 제공", 보유·이용 기간 "동의 철회 또는 서비스 탈퇴 시 지체없이 파기"다. 동의 화면 주소의 요청 범위도 `reqScope=phone_number` 하나다.
- NOL, YES24: 확인하지 못했다.

## 1. Google

- `email`은 "Provided only if you included the `email` scope". `email` scope가 있으면 ID 토큰에 `email`과 `email_verified`가 들어간다. 기본 요청 예시는 `openid email`. ([OpenID Connect - Obtaining user information](https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo), [Authentication URI parameters](https://developers.google.com/identity/openid-connect/openid-connect#authenticationuriparameters))
- `email_verified`: "True if the user's email address has been verified; otherwise false." 언제 false가 되는지는 문서에 없다. ([같은 문서](https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo))
- 이메일은 "may not be unique to this account and could change over time"이라서 계정 식별은 `sub`로 한다. (같은 문서)
- Google이 보증하는 경우는 두 가지다. `@gmail.com` 주소이거나, `email_verified`가 true이고 `hd`가 있는(Workspace) 경우다. 그 밖의 주소는 "email_verified can also be true as Google initially verified the user when the Google account was created, however ownership of the third party email account may have since changed"이고, 비밀번호나 다른 방법으로 확인하라고 권한다. ([Verify the Google ID token - Using the email, email_verified and hd fields](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token))
- Better Auth 기본 scope는 `email profile openid`(`packages/core/src/social-providers/google.ts` 177-179행), `emailVerified: user.email_verified`(267행). Gmail과 Workspace 여부는 구분하지 않는다.

## 2. 카카오

- 사용자 정보 응답의 `kakao_account.email`은 카카오계정 대표 이메일이다. `email_needs_agreement`가 true면 사용자가 동의해야 받을 수 있다. `is_email_valid`가 false면 그 주소가 다른 카카오계정에 쓰여 만료됐다는 뜻이다. `is_email_verified`가 true면 인증된 이메일이다. ([REST API - 사용자 정보 가져오기](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#req-user-info)) 이 항목의 설명은 페이지 요약으로 읽었고 원문 그대로 대조하지 못했다.
- ID 토큰의 이메일은 "유효한 이메일 값이 있는 경우에만 제공"된다. ([REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api))
- 이메일처럼 바뀔 수 있는 정보는 회원 식별자로 쓰지 말라고 한다. 서비스는 이메일의 유효 여부와 인증 여부를 확인해야 한다. ([이해하기](https://developers.kakao.com/docs/latest/ko/kakaologin/common))
- 동의항목 카카오계정(이메일) `account_email`이 지원하는 동의 단계는 "[필수, 선택, 이용 중 동의]: 비즈 앱, 테스트 앱"이다. ([활용하기 - 사용자 정보 동의항목](https://developers.kakao.com/docs/latest/ko/kakaologin/utilize#scope-user))
- "권한이 필요한 동의항목은 추가 기능 신청으로 권한을 받아야" 필수, 선택, 이용 중 동의로 설정할 수 있다. ([활용하기 - 권한](https://developers.kakao.com/docs/latest/ko/kakaologin/utilize#scope-review)) 추가 기능을 신청하려면 비즈 앱 전환, 신청 자격 확인, 비즈니스 정보 심사를 먼저 마쳐야 하고, 심사는 영업일 기준 3~5일 걸린다. ([설정하기](https://developers.kakao.com/docs/latest/ko/kakaologin/prerequisite#additional-features))
- 필수 동의를 거부하면 로그인을 마칠 수 없고, 선택 동의는 거부해도 로그인이 끝난다. ([활용하기 - 동의 단계](https://developers.kakao.com/docs/latest/ko/kakaologin/utilize#scope-level))
- Better Auth 기본 scope는 `account_email profile_image profile_nickname`(`packages/core/src/social-providers/kakao.ts` 117-119행), `emailVerified: !!account.is_email_valid && !!account.is_email_verified`(177행).

## 3. Better Auth

### 이메일이 없을 때

`packages/better-auth/src/api/routes/callback.ts` 206-209행: `userInfo.email`이 없으면 로그를 남기고 `EMAIL_NOT_FOUND`로 에러 페이지에 보낸다. 사용자를 만들지 않고, 이메일을 따로 받는 흐름도 없다.

### 새 사용자 만들기

`packages/better-auth/src/oauth2/link-account.ts` 579-588행: `email`은 소문자로 바꾸고 `emailVerified`는 `userInfo.emailVerified`를 그대로 쓴다. 642-668행: 새 사용자의 `emailVerified`가 false이면 `emailVerification.sendOnSignUp`(없으면 제공자의 `requireEmailVerification`)에 따라 인증 메일을 보낸다. 제공자 옵션에 `requireEmailVerification`이 있으면 인증되기 전까지 `EMAIL_NOT_VERIFIED`로 로그인을 막는다.

### 기존 사용자와 연결하기

같은 제공자 계정이 없고 같은 이메일의 사용자가 있으면 `link-account.ts` 318-342행이 연결 여부를 정한다. 아래 중 하나라도 맞으면 `account not linked`로 거부한다.

- 제공자가 `trustedProviders`에 없고 제공자 이메일이 인증되지 않았다.
- 기존 사용자의 이메일이 인증되지 않았다(`accountLinking.requireLocalEmailVerified`, 기본 true. 소스 주석은 다음 마이너에서 이 조건을 무조건으로 바꾸겠다고 한다).
- `accountLinking.enabled === false` 또는 `disableImplicitLinking === true`.

통과하면 `account` 행을 만들어 기존 사용자에 붙인다(354-364행). `trustedProviders`에 넣으면 제공자 이메일이 인증되지 않아도 연결한다. 문서는 [Users & Accounts - Account Linking](https://www.better-auth.com/docs/concepts/users-accounts#account-linking).

## 확인하지 못한 것

- Google이 `email_verified`를 false로 주는 구체적인 경우. 문서에 없다.
- 카카오 `req-user-info` 필드 설명의 원문. 요약으로만 읽었다.
- 카카오 테스트 앱으로 이메일 동의를 어디까지 쓸 수 있는지, 비즈 앱이 아닌 앱이 이메일을 받을 수 있는지. 테스트 앱 문서를 읽지 않았다. 콘솔에서 확인해야 한다.
- NOL과 YES24가 카카오 가입에서 이메일을 받는지. 멜론은 이메일을 받지 않는다(4장).

## 1.4b 설계 메모

- **제공자가 인증한 이메일은 믿고 다시 인증하지 않는다.** Google은 `email_verified === true`, 카카오는 `is_email_valid && is_email_verified`일 때 `emailVerified = true`로 가입시킨다. Better Auth와 같은 판정이다. Google의 비 Gmail 주소 위험은 기록만 하고 범위 밖으로 둔다.
- **이메일이 없거나 인증되지 않았으면 가입 화면에서 이메일을 받고 1.4a 인증번호 흐름(#76)을 그대로 쓴다.** 카카오를 선택 동의로 두거나 비즈 앱이 아니면 이메일이 오지 않는다. Better Auth는 이 경우 가입을 거부하지만, 우리는 가입을 끝내지 않은 채 소셜 계정 정보를 잠깐 들고 있다가 인증번호를 확인한 뒤 계정을 만든다. 이 점은 Better Auth와 다르니 스펙에 적는다.
- **인증된 소셜 이메일이 기존 이메일 사용자와 같으면 Better Auth처럼 자동 연결한다.** 1.4a에서 이메일 가입자는 모두 인증을 마친 뒤 만들어지므로 `requireLocalEmailVerified` 조건은 항상 맞는다. 제공자 이메일이 인증되지 않았으면 연결하지 않고 거부한다(`trustedProviders`는 쓰지 않는다). 사용자가 직접 입력해 인증한 이메일이 기존 계정과 같을 때도, 인증번호로 소유가 확인됐으니 같은 규칙으로 연결한다. 연결할 때 사용자에게 알릴지는 구현 이슈에서 정한다.
- **열린 질문: 소셜 가입에 이메일이 꼭 필요한가.** 멜론은 카카오 가입에서 이메일을 받지 않고 전화번호만 받는다(4장). 우리도 소셜 가입 사용자에게 이메일을 받지 않을 수 있다. 이메일이 필요한 곳(예매 확인 메일, 계정 연결)을 1.4b에서 정리한 뒤, 위 두 항목(이메일을 받아 인증하기, 같은 이메일이면 연결하기)을 적용할지 정한다. 실제 서비스와 같은 모양을 따르려면 NOL과 YES24의 카카오 동의 화면도 확인한다.
