# 코딩 표준

도구로 강제할 수 없는 규칙만 적는다. 포맷, 린트, 타입, 단위 테스트는 pre-commit이 검사한다.

- 코드의 이름에는 `GLOSSARY.md`의 용어와 영어 이름을 쓴다. 예: 공연은 `Show`, 회차는 `Performance`다.
- 비즈니스 로직은 NestJS API에 둔다. 스토어는 API를 호출하고 결과를 표시만 한다.
- API는 HTTP 경계에서 외부에 보이는 동작을 테스트한다. 서비스나 리포지토리의 내부 동작은 따로 테스트하지 않는다. DB가 필요한 테스트는 `*.int.spec.ts`로 두어 `test:integration`으로만 실행한다.
- 스토어는 API를 호출하는 함수를 페이지 밖으로 분리하고, 가짜 `fetch`를 넣어 테스트한다.
- 테스트 파일은 `*.spec.ts`로 짓고, 검증하는 소스 파일 옆에 둔다. 예: `src/shows/fetch-shows.ts`의 테스트는 `src/shows/fetch-shows.spec.ts`. 앱 전체를 띄워 HTTP로 검증하거나 공용 준비 코드가 필요한 테스트처럼 한 소스 파일에 속하지 않는 테스트만 앱의 `test/`에 둔다. 예: `apps/api/test/shows.int.spec.ts`.
- `insert`, `update`, `delete`는 테이블을 소유한 모듈의 서비스에서만 실행한다. 읽기 전용 JOIN은 어느 모듈에서나 허용한다. 시드 스크립트와 테스트 데이터 준비 코드는 예외다.
- 스키마 파일은 다른 스키마 파일과 Drizzle만 import한다. drizzle-kit이 스키마 파일과 그 import를 실제로 실행하기 때문이다.
- 테이블 이름은 복수형을 쓴다. 예: `shows`. 용어집의 `Order`, `User`는 단수형이 PostgreSQL 예약어다.
