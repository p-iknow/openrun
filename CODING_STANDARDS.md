# 코딩 표준

도구로 강제할 수 없는 규칙만 적는다. 포맷, 린트, 타입, 단위 테스트는 pre-commit이 검사한다.

- 코드의 이름에는 `GLOSSARY.md`의 용어와 영어 이름을 쓴다. 예: 공연은 `Show`, 회차는 `Performance`다.
- 매개변수가 2개 이상인 함수는 호출하는 곳에서 각 인자의 뜻이 보이게 객체로 받는다. 값을 모두 객체 하나로 받거나(`f({ a, b })`), 함수가 다루는 주된 값이 분명하면 그 값과 나머지를 담은 `options` 객체로 받는다(`f(main, options)`). 예: `blockAfter(css, ':root')`가 아니라 `blockAfter(css, { selector: ':root' })`. 가변 인자(`cn(...inputs)`)와 라이브러리가 정한 시그니처(`map` 콜백, `it.each` 콜백 등)는 예외다.
- 비즈니스 로직은 NestJS API에 둔다. 스토어는 API를 호출하고 결과를 표시만 한다. 응답을 화면에 맞게 가공하는 것은 허용하지만, 업무 규칙을 판단하지 않는다.
- API는 HTTP 경계에서 외부에 보이는 동작을 테스트한다. 서비스나 리포지토리의 내부 동작은 따로 테스트하지 않는다. DB가 필요한 테스트는 `*.int.spec.ts`로 두어 `test:integration`으로만 실행한다.
- 스토어는 API를 호출하는 함수를 페이지 밖으로 분리하고, 호출만 하게 둔다. 호출 함수는 `unwrap`으로 성공 값을 꺼내고, 오류 응답은 `unwrap`이 `transformErrorResponse`로 바꿔 던진다(이름은 RTK Query를 따랐다). 성공 값을 화면에 맞게 바꾸거나 값에 따라 분기하는 로직은 성공 데이터를 인자로 받는 순수 함수(select 함수, TanStack Query의 `select`와 같은 뜻)로 뺀다. select 함수와 `transformErrorResponse`는 응답 예시를 넣어 테스트한다.
- 타입, 선언, 라이브러리가 이미 보장하는 동작은 테스트하지 않고, 직접 만든 규칙과 분기만 테스트한다. 예: 생성된 타입대로 응답을 넘기기만 하는 함수, DTO에 선언한 검증 규칙 하나하나는 테스트하지 않는다.
- 테스트 파일은 `*.spec.ts`로 짓고, JSX를 쓰면 `*.spec.tsx`로 짓는다. 검증하는 소스 파일 옆에 둔다. 예: `src/shows/select-shows.ts`의 테스트는 `src/shows/select-shows.spec.ts`, `src/pagination.tsx`의 테스트는 `src/pagination.spec.tsx`. 앱 전체를 띄워 HTTP로 검증하거나 공용 준비 코드가 필요한 테스트처럼 한 소스 파일에 속하지 않는 테스트만 앱의 `test/`에 둔다. 예: `apps/api/test/shows.int.spec.ts`.
- `insert`, `update`, `delete`는 테이블을 소유한 모듈의 서비스에서만 실행한다. 읽기 전용 JOIN은 어느 모듈에서나 허용한다. 시드 스크립트와 테스트 데이터 준비 코드는 예외다.
- 스키마 파일은 다른 스키마 파일과 Drizzle만 import한다. drizzle-kit이 스키마 파일과 그 import를 실제로 실행하기 때문이다.
- 테이블 이름은 복수형을 쓴다. 예: `shows`. 용어집의 `Order`, `User`는 단수형이 PostgreSQL 예약어다.
