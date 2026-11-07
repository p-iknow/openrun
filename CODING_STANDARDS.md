# 코딩 표준

도구로 강제할 수 없는 규칙만 적는다. 포맷, 린트, 타입, 단위 테스트는 pre-commit이 검사한다.

- 코드의 이름에는 `GLOSSARY.md`의 용어와 영어 이름을 쓴다. 예: 공연은 `Show`, 회차는 `Performance`다.
- 비즈니스 로직은 NestJS API에 둔다. 스토어는 API를 호출하고 결과를 표시만 한다.
- API는 HTTP 경계에서 외부에 보이는 동작을 테스트한다. 서비스나 리포지토리의 내부 동작은 따로 테스트하지 않는다. 테스트 파일은 `apps/api/test/`에 `*.spec.ts`로 둔다.
- 스토어는 API를 호출하는 함수를 페이지 밖으로 분리하고, 가짜 `fetch`를 넣어 테스트한다.
- `insert`, `update`, `delete`는 테이블을 소유한 모듈의 서비스에서만 실행한다. 읽기 전용 JOIN은 어느 모듈에서나 허용한다.
- 스키마 파일은 다른 스키마 파일과 Drizzle만 import한다. drizzle-kit이 스키마 파일과 그 import를 실제로 실행하기 때문이다.
- 테이블 이름은 복수형을 쓴다. 예: `shows`. 용어집의 `Order`, `User`는 단수형이 PostgreSQL 예약어다.
