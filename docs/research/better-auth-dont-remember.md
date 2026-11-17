# Better Auth가 rememberMe: false를 `dont_remember` 쿠키로 들고 다니는 까닭

조사일은 2026-11-16이다. 우리는 로그인 상태 유지 여부를 세션 행(`remember_me` 칸)에 둔다([ADR 0009](../adr/0009-session-auth-modeled-on-better-auth.md)). Better Auth는 같은 값을 세션 테이블이 아니라 서명된 별도 쿠키 `dont_remember`로 들고 다닌다. 왜 그렇게 했는지 1차 자료에 적혀 있는지, 우리 추측 두 가지(여러 DB 어댑터가 공유하는 세션 스키마에 칸을 더하지 않으려 했다, 쿠키 캐시로 DB를 건너뛸 때도 이 값이 필요했다)가 맞는지 봤다.

## 방법

[Better Auth의 세션 관리](better-auth-session.md)와 같은 기준으로 봤다. 블로그와 2차 자료는 보지 않았다.

- `better-auth/better-auth` 저장소 `main`, 커밋 `f39e6c66cc657e677b72828d0aff20b6ade2adae`(2026-11-13), `packages/better-auth` 버전 **1.7.23**. 저장소 밖 임시 디렉터리에 clone해 `git grep`, `git log`, `git show`로 읽었고 코드는 실행하지 않았다.
- 이력은 이 커밋에서 거꾸로 따라갔다(`git log -S`, `-G`, 커밋별 `git grep`). PR과 이슈는 `gh pr view`, `gh issue view`, `gh search issues|prs`(검색어 `dont_remember`, `dontRememberMe`, `rememberMe`, `remember me`, `rememberMe session table`, `rememberMe column`), Discussions는 GraphQL 검색(`rememberMe`, `dont_remember`)으로 봤다.
- 아래 소스 경로는 `better-auth/better-auth` 저장소 기준이고, 따로 적지 않은 줄 번호는 위 커밋 기준이다.

## 결론

- **설계 까닭을 적은 1차 자료는 찾지 못했다.** 쿠키는 2024-09-04 커밋 [`e61501705`](https://github.com/better-auth/better-auth/commit/e61501705efa3abdb6f6e3312b2bc38dc886391e)(메시지 `examples`, 0.0.8-beta.5)에서 PR 없이 `main`에 바로 들어왔다. 코드에 남은 설명은 "max age가 없으니 브라우저를 닫으면 사라진다"는 주석과 "기억하지 않기를 원하면 세션을 갱신할 필요가 없다"는 주석뿐이다. 그 뒤 PR과 이슈 어디에도 rememberMe를 세션 테이블에 두자는 논의나, 쿠키로 둔 까닭을 설명한 글이 없다.
- **추측 1(여러 어댑터가 공유하는 스키마)은 들어온 시점의 사실과 맞지 않는다.** 그때 패키지 안 어댑터는 Kysely 하나뿐이었다. 바로 일주일 전(2024-08-28)에는 세션 테이블에 `ipAddress`, `userAgent` 칸을 그냥 더했다. 칸 추가를 꺼린 흔적은 없다. 다만 사용자 DB 마이그레이션을 피하려 했을 가능성까지 반박하는 자료도 없다.
- **추측 2(쿠키 캐시)는 원래 까닭이 될 수 없다.** 쿠키 캐시(`session_data`)는 `dont_remember`보다 7주 늦은 2024-10-26([#318](https://github.com/better-auth/better-auth/pull/318))에 들어왔다. 게다가 캐시 쿠키에는 세션 행 전체가 들어가므로, 이 값이 세션 칸이었다면 캐시에도 그대로 실렸을 것이다. 캐시가 별도 쿠키를 필요로 하지는 않는다.
- **코드로 추론한 가장 그럴듯한 모양은 "세션 쿠키와 같은 수명을 가진 표식"이다(추론).** 바로 전 커밋까지 `getSession`은 갱신할 때마다 세션 쿠키를 `maxAge`를 붙여 다시 구웠다. 그러면 브라우저를 닫으면 사라져야 할 쿠키가 영속 쿠키로 바뀐다. `e61501705`은 `Max-Age` 없는 표식 쿠키를 하나 더 굽고, `getSession`이 그 표식을 보면 갱신 단계를 건너뛰게 했다. 표식도 브라우저를 닫으면 함께 사라지게 했다.
- **값이 세션이 아니라 브라우저에 붙어 있어서 생긴 버그가 거듭 나왔다.** 2FA([#1564](https://github.com/better-auth/better-auth/issues/1564)), 관리자 대리 로그인([#2183](https://github.com/better-auth/better-auth/issues/2183), [#10734](https://github.com/better-auth/better-auth/issues/10734) 열림), 쿠키 캐시([#4491](https://github.com/better-auth/better-auth/issues/4491)), 다음 로그인에 남는 표식([#11466](https://github.com/better-auth/better-auth/issues/11466), 1.7.17에서 고침)이다. 표식만 사라지면 끈 세션이 다음 `getSession`에서 곧바로 7일 세션으로 연장되고, 세션 쿠키도 영속 쿠키로 바뀐다(코드 추론).

## 1. 지금 코드에서 `dont_remember`를 쓰는 곳

### 정의

- `packages/better-auth/src/cookies/index.ts` 132행: `createCookie("dont_remember")`. 다른 쿠키와 달리 `maxAge`를 넘기지 않으므로 기본 속성(`HttpOnly`, `SameSite=Lax`, `Path=/`, HTTPS면 `Secure`와 `__Secure-` 접두사)만 붙은 세션 쿠키(`Max-Age` 없음)다. 이름은 `better-auth.dont_remember`(46-118행 `createCookieGetter`의 접두사 규칙).
- 같은 파일 146-149행이 `authCookies.dontRememberToken`으로 내보낸다. 타입은 `packages/core/src/types/cookie.ts` 10행.

### 굽기(set)

- `setSessionCookie`(`cookies/index.ts` 356-402행). 인자 `dontRememberMe`가 `undefined`면 요청에 실린 표식에서 값을 이어받는다(365-371행). 참이면 `session_token`을 `Max-Age` 없이 굽고(374-386행) 표식에 서명한 값 `"true"`를 굽는다(388-394행). 값 자체는 뜻이 없고, 서명이 맞는 표식이 있느냐만 본다.
- 로그인 경로는 `rememberMe === false`를 그대로 넘긴다. 이메일 로그인은 `packages/better-auth/src/api/routes/sign-in.ts` 611행(`createSession`)과 628행(`setSessionCookie`).
- 관리자 대리 로그인은 늘 표식을 굽는다. `plugins/admin/routes.ts` 1316-1326행이 `createSession(targetUser.id, true, …)`, 1346-1353행이 `setSessionCookie(ctx, …, true)`다. 대리 세션(기본 1시간)이 7일로 늘어나지 않게 하려는 것이라고 [#10734](https://github.com/better-auth/better-auth/issues/10734) 본문이 설명한다.

### 읽기(read)

모두 `ctx.getSignedCookie(…dontRememberToken.name, ctx.context.secret)`로 읽는다. 서명이 틀리면 `null`이므로 표식이 없는 것과 같다.

| 위치 | 쓰임 |
| --- | --- |
| `api/routes/session.ts` 128-131행 | `getSession`이 요청 처음에 읽는다 |
| `api/routes/session.ts` 221-225행 | 쿠키 캐시 갱신 때 `session_token`의 `maxAge`를 정한다 |
| `api/routes/session.ts` 310-313행 | 표식이 있으면 DB 세션 갱신(슬라이딩)을 건너뛴다 |
| `api/routes/session.ts` 355행, 417행 | 갱신하지 않는 응답에서 쿠키 캐시의 `maxAge`를 정한다 |
| `cookies/index.ts` 365-371행 | `setSessionCookie`가 인자 없을 때 이어받는다 |
| `plugins/two-factor/verify-two-factor.ts` 69-72행, 91-94행 | 2FA를 통과하면 표식을 보고 세션 만료를 정한다 |
| `plugins/admin/routes.ts` 1334-1345행, 1418행, 1428행 | 대리 로그인 전 관리자의 선택을 `admin_session` 쿠키에 `토큰:표식` 형태로 보관했다가 되돌린다 |
| `plugins/email-otp/routes.ts` 531-545행 | 이메일 인증 뒤 쿠키 캐시를 다시 구울 때 `maxAge`를 정한다 |

`session.ts` 310-313행의 주석은 이렇다.

```ts
/**
 * We don't need to update the session if the user doesn't want to be remembered
 * or if the session refresh is disabled
 */
if (dontRememberMe || ctx.query?.disableRefresh) {
```

### 지우기(delete)

- `deleteSessionCookie`(`cookies/index.ts` 511-546행)가 `session_token`, `session_data`와 함께 표식을 지운다(543-545행). 두 번째 인자 `skipDontRememberMe`가 참이면 표식만 남긴다.
- 로그아웃(`api/routes/sign-out.ts` 100행)과 `getSession`이 세션을 못 찾거나 만료됐을 때(`session.ts` 291-294행)가 이 함수를 부른다. 따라서 로그아웃과 만료 때 표식도 함께 지운다.
- 2FA 첫 단계는 표식만 남긴다(`plugins/two-factor/index.ts` 596-609행, 607행 `deleteSessionCookie(ctx, true)`). 비밀번호 단계에서 만든 세션은 지우지만, 2FA를 통과한 뒤 새 세션을 만들 때 사용자의 선택이 필요하기 때문이다. 이 단계에는 세션 행이 없으므로 선택을 담을 곳이 쿠키뿐이다. [#1566](https://github.com/better-auth/better-auth/pull/1566)(2025-02-25, [#1564](https://github.com/better-auth/better-auth/issues/1564)를 닫음)에서 들어왔다.
- `setSessionCookie`가 `dontRememberMe === false`를 명시적으로 받았고 요청에 표식이 있으면 지운다(`cookies/index.ts` 395-399행). [#12181](https://github.com/better-auth/better-auth/pull/12181)(2026-11-04 병합, 1.7.17, [#11466](https://github.com/better-auth/better-auth/issues/11466)을 닫음)에서 들어왔다(`packages/better-auth/CHANGELOG.md` 161행, 165행).
- 2FA에서 `trustDevice`를 고르면 표식을 지운다(`verify-two-factor.ts` 138-139행, 주석 "delete the dont remember me cookie").

## 2. 이력: 언제, 어떻게 들어왔나

### 2024-08-29: 매개변수만 있고 표식은 없었다

[`f1e363bbf`](https://github.com/better-auth/better-auth/commit/f1e363bbff5e4bae26b8a34560871d643f86ebbb)(Bereket Engida, "feat: remember me and many more imporves")가 로그인 본문에 `dontRememberMe`를 더했다. 참이면 세션 쿠키를 `maxAge: undefined`로 구웠다(`packages/better-auth/src/api/routes/sign-in.ts`). 같은 커밋의 `getSession`은 세션을 갱신할 때마다 쿠키를 `maxAge: updatedSession.expiresAt - now`로 다시 구웠다(`packages/better-auth/src/api/routes/session.ts`). 그래서 첫 갱신에서 세션 쿠키가 영속 쿠키로 바뀌었다(코드 추론). 이 커밋은 빈 `plugins/remeber-me` 플러그인을 지우고 `todo.md`의 "remember me functionality"에 체크했다.

### 2024-09-04: `dont_remember` 쿠키가 들어왔다

[`e61501705`](https://github.com/better-auth/better-auth/commit/e61501705efa3abdb6f6e3312b2bc38dc886391e)(Bereket Engida, 메시지 `examples`, `packages/better-auth` 0.0.8-beta.5)가 지금 구조의 뼈대를 한 번에 넣었다. GitHub API(`repos/…/commits/e61501705…/pulls`)는 연결된 PR이 없다고 돌려준다. `main`에 바로 들어온 커밋이라 PR 본문이나 리뷰가 없다.

- `packages/better-auth/src/utils/cookies.ts`에 `dontRememberToken`을 더했다. 주석은 `//no max age so it expires when the browser closes`다.
- `setSessionCookie`를 새로 만들었다. `dontRememberMe`가 참이면 세션 쿠키를 `maxAge` 없이 굽고 표식 `"true"`에 서명해 굽는다.
- `deleteSessionCookie`를 새로 만들어 세션 쿠키와 표식을 함께 지운다. 로그아웃이 이 함수를 쓴다.
- `getSession`이 표식을 읽고, 있으면 갱신 없이 돌려준다. 주석은 `We don't need to update the session if the user doesn't want to be remembered`다. 같은 커밋에서 NextAuth를 본뜬 `updateAge` 갱신 주기 계산도 들어왔다.
- `createSession`에 `dontRememberMe`를 더해 만료를 1일로 둔다. 주석은 "If the user doesn't want to be remembered set the session to expire in 1 day. The cookie will be set to expire at the end of the session"이다.
- 소셜 로그인은 OAuth `state`에 `dontRememberMe`를 실어 콜백에서 꺼냈다.

이 커밋 시점의 세션 스키마는 `id`(이때는 이 값이 토큰), `userId`, `expiresAt`, `ipAddress`, `userAgent`였다(`packages/better-auth/src/adapters/schema.ts` 31-37행, `adapters/get-tables.ts` 51-74행, 커밋 `e61501705` 기준). 패키지 안 어댑터 파일은 `adapters/kysely.ts` 하나였고, Prisma, Drizzle, MongoDB 어댑터는 없었다(`git ls-tree` 확인).

일주일 전 커밋 [`ed3579d19`](https://github.com/better-auth/better-auth/commit/ed3579d19)(2024-08-28, "feat: ip and user agent on sessin")는 세션 테이블에 `ipAddress`, `userAgent` 칸을 더했다(`adapters/get-tables.ts`, `adapters/schema.ts`).

### 그 뒤

| 날짜 | PR/커밋 | 바뀐 것 | 까닭을 적었나 |
| --- | --- | --- | --- |
| 2024-10-26 | [#318](https://github.com/better-auth/better-auth/pull/318) | 쿠키 캐시(`session_data`) 도입. 표식을 읽는 위치만 옮겼다 | 본문 없음 |
| 2024-11-10 | [#476](https://github.com/better-auth/better-auth/pull/476) | API 이름을 `dontRememberMe`에서 `rememberMe`(기본 `true`)로 바꿨다. 쿠키 이름은 그대로 | 이름이 문법에 안 맞고 직관적이지 않다는 이유만 적었다 |
| 2025-02-25 | [#1566](https://github.com/better-auth/better-auth/pull/1566) | 2FA가 표식을 지키게 했다(`skipDontRememberMe`) | "closes #1564"뿐 |
| 2025-04-12 | [#2236](https://github.com/better-auth/better-auth/pull/2236) | 대리 로그인 전 관리자의 표식을 `admin_session`에 보관한다 | "closes #2183"뿐 |
| 2025-09-11 | [#4558](https://github.com/better-auth/better-auth/pull/4558) | 표식이 있으면 `session_data`도 `Max-Age` 없이 굽는다 | "closes #4491"과 자동 요약뿐 |
| 2026-11-04 | [#12181](https://github.com/better-auth/better-auth/pull/12181) | 기억하는 로그인에서 남은 표식을 지운다 | 버그 설명뿐 |

[#11467](https://github.com/better-auth/better-auth/pull/11467)은 #12181과 같은 수정을 먼저 냈으나 병합되지 않고 닫혔다.

### 검색에서 나온 논의

- 이슈·PR 검색어 `rememberMe session table`, `rememberMe column`, `remember me session schema`는 결과가 없다. rememberMe를 세션 테이블 칸으로 두자는 제안은 찾지 못했다.
- [#3112](https://github.com/better-auth/better-auth/issues/3112)(rememberMe: false인데 브라우저를 닫아도 로그인이 남는다)에서 메인테이너 Bekacru는 "세션 쿠키의 만료가 `session`이어야 하고 `dont_remember` 쿠키도 있어야 한다"고 확인 방법만 답했다. 원인은 브라우저의 "이전 세션 복원"이 세션 쿠키를 살려 두는 것으로 정리됐다. 설계 까닭은 나오지 않는다.
- [#4491](https://github.com/better-auth/better-auth/issues/4491)과 Discussions [#5375](https://github.com/better-auth/better-auth/discussions/5375)도 동작 질문이고 까닭은 없다.

## 3. 공식 문서

- `docs/content/docs/concepts/cookies.mdx` 37-41행: 기본 쿠키 목록에 "`dont_remember` to store the flag when `rememberMe` is disabled"라고 한 줄 적는다. 왜 쿠키인지는 적지 않는다.
- `docs/content/docs/authentication/email-password.mdx` 89-91행: `rememberMe`는 "If false, the user will be signed out when the browser is closed. (optional) (default: true)".
- `docs/content/docs/basic-usage.mdx` 86-90행: "remember the user session after the browser is closed. @default true".
- `packages/core/src/types/init-options.ts` 406-414행: `advanced.cookies`로 이름과 속성을 바꿀 수 있는 기본 쿠키에 `"dont_remember"`를 넣는다.
- `docs/content/docs/concepts/session-management.mdx`에는 rememberMe 설명이 없다. 끈 세션의 만료가 1일이고 갱신하지 않는다는 사실은 문서에 없고 코드에만 있다.

## 4. 세션 스키마, 쿠키 캐시, secondary storage, stateless 모드

### 세션 스키마에 칸이 없다

`packages/core/src/db/get-tables.ts` 130-196행의 세션 필드는 `expiresAt`, `token`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId`이고 `packages/core/src/db/schema/session.ts`에도 rememberMe가 없다. `createSession`(`packages/better-auth/src/db/internal-adapter.ts` 553-560행)은 `dontRememberMe`를 받아 `expiresAt`(1일 또는 `expiresIn`)을 정하는 데만 쓰고 저장하지 않는다(594-601행). 세션 행만 보면 끈 세션과 켠 세션을 구별할 수 없다. 같은 파일 187-198행의 주석은 일괄 폐기 기준 시각의 TTL을 정할 때 "`dontRememberMe`의 1일 세션"을 따로 고려해야 한다고 적는다.

### 쿠키 캐시

- 캐시 페이로드는 세션 행 전체와 사용자 행이다(`cookies/index.ts` 157-198행 `setCookieCache`의 `filteredSession`, `filteredUser`). rememberMe가 세션 칸이었다면 캐시에도 실렸을 것이므로, 캐시 때문에 별도 쿠키가 필요하지는 않다(코드 추론).
- 실제로 캐시는 표식을 `session_data`의 `maxAge`를 정하는 데만 쓴다(194-198행). 표식이 있으면 캐시 쿠키도 `Max-Age` 없이 굽는다([#4558](https://github.com/better-auth/better-auth/pull/4558)).
- 캐시가 유효해 DB를 건너뛰는 응답에서도 표식은 `getSession` 처음(128-131행)에 이미 읽혀 있다. 이때 표식이 하는 일은 `session_token`의 `maxAge`를 정하는 것뿐이다(221-225행).

### stateless 모드

DB와 secondary storage가 둘 다 없으면 `session_data` 쿠키가 세션 기록 자체다(`session.ts` 531행 주석 "Stateless deployments keep the signed cookie as the session record"). 캐시 갱신(`cookieRefreshCache`)은 이 모드에서만 켜진다(`packages/better-auth/src/context/create-context.ts` 325-330행). 이 갱신 경로는 표식이 있어도 갱신을 건너뛰지 않는다. `session_data`는 `setCookieCache(ctx, refreshedSession, false)`로 `Max-Age`를 붙여 굽고(`session.ts` 205-218행), `session_token`만 표식을 보고 `Max-Age`를 뺀다(221-225행). 캐시 안 세션의 `expiresAt`은 바꾸지 않으므로(209-215행), 끈 세션은 캐시 안 `expiresAt`(1일)이 지나면 끝난다(162-169행). 표식이 있는데 캐시 쿠키에만 `Max-Age`가 붙는 것은 #4558의 의도와 어긋나 보이지만, 이것이 의도인지는 1차 자료에서 확인하지 못했다.

### secondary storage

secondary storage에는 세션 객체를 JSON으로 저장한다(`internal-adapter.ts` 695행 근처 `secondaryStorage.get(token)`). 세션 객체에 rememberMe가 없으므로 여기에도 없다. 갱신 여부는 저장소와 상관없이 요청의 표식으로 정한다.

## 5. 쿠키만 사라지거나 남을 때

아래는 위 코드에서 추론한 동작이다. 실행해 확인하지는 않았다.

- **표식만 사라지면(사용자가 지움, 서명이 틀림) 끈 세션이 켠 세션이 된다.** `getSession`은 표식이 없으면 갱신 단계로 간다. 끈 세션은 `expiresAt = 만든 시각 + 1일`이므로 갱신 기준 시각 `expiresAt - expiresIn + updateAge`(기본값이면 만든 시각 - 5일)가 이미 지났다(`session.ts` 338-341행). 그래서 바로 `expiresAt`을 `지금 + expiresIn`(7일)으로 다시 쓰고(371-380행), `setSessionCookie(…, false, { maxAge })`로 `session_token`을 `Max-Age`가 붙은 영속 쿠키로 굽는다(390-400행). 표식은 `HttpOnly`라 페이지 스크립트로는 못 지우지만 사용자는 지울 수 있다.
- **표식만 남으면(다음 로그인이 기억하는 로그인) 새 세션이 갱신되지 않았다.** 1.7.17 전까지 `setSessionCookie`는 표식을 굽기만 하고 지우지 않았다. 그래서 같은 브라우저에서 다음에 rememberMe를 켜고 로그인해도 `getSession`이 갱신을 건너뛰어, 새 세션이 `만든 시각 + expiresIn`에 끝났다([#11466](https://github.com/better-auth/better-auth/issues/11466)). [#12181](https://github.com/better-auth/better-auth/pull/12181)이 `dontRememberMe === false`가 명시된 경로에서 표식을 지우게 고쳤다. `setSessionCookie`에 값을 넘기지 않는 경로는 여전히 요청의 표식을 이어받는다(365-371행). 관리자 대리 로그인을 두 번째 하고 끝낼 때 관리자 세션이 브라우저 세션 쿠키로 돌아오는 문제([#10734](https://github.com/better-auth/better-auth/issues/10734))는 조사 시점에 열려 있다.
- **둘 다 세션 쿠키라 보통 함께 사라진다.** 브라우저를 닫으면 `session_token`(끈 세션이면 `Max-Age` 없음)과 표식이 함께 사라진다. 브라우저의 "이전 세션 복원"은 둘 다 살려 둔다([#3112](https://github.com/better-auth/better-auth/issues/3112)). 이때도 DB의 `expiresAt`(1일)이 상한이다.
- **로그아웃과 만료 때 함께 지운다.** 로그아웃(`sign-out.ts` 100행)과 `getSession`의 세션 없음·만료 처리(`session.ts` 291-294행)는 `deleteSessionCookie`로 표식까지 지운다. 2FA 첫 단계만 표식을 일부러 남긴다(`two-factor/index.ts` 607행).
- **2FA `trustDevice`를 고르면 그 응답에서 표식을 지운다.** `setSessionCookie(ctx, { session, user })`는 인자가 없어 표식을 이어받아 `session_token`을 `Max-Age` 없이 굽고(`verify-two-factor.ts` 101-104행), 이어서 표식을 지운다(138-139행). 세션 행은 1일, 쿠키는 브라우저 세션 쿠키로 시작하지만 다음 `getSession`부터는 표식이 없으니 바로 위 첫 항목처럼 7일 세션이 된다.

## 이어서 볼 문서

- [Better Auth의 세션 관리](better-auth-session.md)
- [ADR 0009](../adr/0009-session-auth-modeled-on-better-auth.md)
