# Drizzle 스키마 파일 구성 조사

조사일은 2026-11-07이다. 비교 대상은 A(`src/db/schema/<module>.ts`)와 B(`src/modules/<module>/<module>.schema.ts`)다.

버전: npm `latest`는 `drizzle-orm@0.45.4`, `drizzle-kit@0.31.11`이고 `rc`는 둘 다 `1.0.0-rc.5`다([npm](https://www.npmjs.com/package/drizzle-orm?activeTab=versions), [릴리스](https://github.com/drizzle-team/drizzle-orm/releases)). v1 정식판은 아직 없다. 공식 문서 사이트는 이미 v1 기준이다([NestJS 문서의 안내](https://github.com/nestjs/docs.nestjs.com/blob/master/content/data/drizzle.md)).

## 결론 요약

- **기술적으로는 A와 B가 갈리지 않는다.** 공식 문서는 둘 다 허용하고 권장하지 않는다(Q1). 마이그레이션은 파일 위치와 무관하며, 이동만으로는 새 마이그레이션이 생기지 않는다(Q5, 실험). 순환 import 제약도 A와 B에 똑같이 적용된다(Q4).
- **실사용은 A 쪽이 많다.** 레이아웃과 무관하게 고른 28개 중 A 15, B 2, 단일 파일 11이다. NestJS 16개만 보면 A 10, B 1, 단일 파일 5이고, NestJS 공식 샘플과 문서는 단일 파일이다(Q6). 다만 B도 opencode, papra, cella, lombok처럼 실제 프로젝트에서 쓰인다. 모듈러 모놀리스를 자칭한 소수 레포는 확인한 3개 모두 B였으나 스타가 0~6개라 근거로 약하다.
- **어느 쪽이든 relations는 한곳에 모이기 쉽다.** `defineRelations`는 대상 테이블을 모두 담은 객체를 요구하므로, B를 골라도 RQB를 쓰면 중앙 집계 파일이 생긴다(Q3).
- **함정은 각각 있다.** A는 폴더 안에 `index.ts` 배럴을 두고 glob으로 읽으면 v1 RC에서 `generate`가 실패한다. B는 glob에서 벗어난 파일의 테이블이 `DROP TABLE` 마이그레이션으로 나온다(같은 위험이 배럴 누락에도 있다고 추론한다)(Q2, Q5).
- **추론:** 증거는 기본값으로 A를 약하게 지지한다. 근거는 NestJS 쪽 선례와 relations 중앙 집계이며, 기술적 우위는 아니다. 나중에 옮겨도 마이그레이션 비용이 없으므로 되돌리기 쉬운 결정이다. 모듈이 자기 테이블을 소유한다는 경계를 코드 위치로 드러내는 것을 더 중시하면 B도 기술적 장애가 없다.

## 표기와 검증 방법

각 항목은 **공식 문서**, **소스**, **실험**, **관찰**, **추론**으로 구분한다.

**실험**은 npm에 배포된 패키지를 임시 디렉터리에 `--ignore-scripts`로 설치하고, 직접 작성한 픽스처에 `drizzle-kit generate`, `tsc`를 돌린 결과다. 클론한 레포 코드는 실행하지 않았다. 환경은 Node 26, PostgreSQL 방언, CommonJS 설정(`type: module` 아님)이고 DB에는 연결하지 않았다. 스테이블은 `0.45.4`/`0.31.11`, RC는 `1.0.0-rc.5`이며, 별도 표시가 없으면 두 버전의 결과가 같다.

## Q1. 공식 문서의 파일 구성 안내

**공식 문서** ([Schema declaration](https://orm.drizzle.team/docs/sql-schema-declaration)):

- "You can declare your SQL schema directly in TypeScript either in a single `schema.ts` file, or you can spread them around — whichever you prefer, all the freedom!"
- "The most common way to declare your schema with Drizzle is to put all your tables into one `schema.ts` file." / "This approach works well if you don't have too many table models defined, or if you're okay with keeping them all in one file"
- "You can place your Drizzle models — such as tables, enums, sequences, etc. — not only in one file but in any file you prefer. The only thing you must ensure is that you export all the models from those files so that the Drizzle kit can import them and use them in migrations."
- "One use case would be to separate each table into its own file." 예시는 `src/db/schema/users.ts` 형태다.

**판단:** 권장이 아니라 지원 선택지의 나열이다. 유일한 필수 조건은 export다. "most common"은 관행에 대한 서술이다. A와 B 중 하나를 권하는 문장은 없다. 문서는 양쪽 모양을 모두 예시로 든다. `drizzle.config` 페이지 예시에 기능 폴더별 `./src/user/schema.ts`(B 계열)와 중앙 `./src/schema/*`(A 계열)가 함께 있다([SchemaFilePaths 원문](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/mdx/SchemaFilePaths.mdx)).

레이아웃을 권하는 메인테이너 발언은 찾지 못했다. 찾지 못했다는 뜻이지 없다는 증거는 아니다.

## Q2. `schema`의 glob과 배열 지원

**공식 문서** ([drizzle.config](https://orm.drizzle.team/docs/drizzle-config-file)): "`glob` based path to drizzle schema file(s) or folder(s) contaning schema files." 타입은 `string`, `string[]`이다. 예시는 `./src/**/schema.ts`, `["./src/user/schema.ts", "./src/posts/schema.ts"]`, `./src/schema/*`, `./src/**/*.sql.ts`("Dax's favourite")다. 페이지에 주의사항은 적혀 있지 않다.

문서에 없는 주의사항(소스, 실험, 이슈):

| 항목 | 내용 | 근거 |
|---|---|---|
| 폴더 경로는 재귀가 아님 | 문서는 "find all the files recursively"라고 하지만, 폴더를 지정하면 한 단계만 읽고 하위 폴더는 건너뛴다. `./src/schema` 지정 시 `nested/deep.ts`의 테이블이 빠졌다. 재귀는 `**`로 해야 한다. | 소스 [0.31.11](https://github.com/drizzle-team/drizzle-orm/blob/eab8bedbb65d5429c54e612ddbd88aa23091d398/drizzle-kit/src/serializer/index.ts#L73-L95), [rc.5](https://github.com/drizzle-team/drizzle-orm/blob/v1.0.0-rc.5/drizzle-kit/src/utils/utils-node.ts#L23-L83), 실험 |
| 부정 패턴 미지원 | `"!./src/m/q.schema.ts"`는 아무 효과가 없고 경고도 없다. | [#5379](https://github.com/drizzle-team/drizzle-orm/issues/5379)(open), 실험 |
| 범위 안 배럴 | glob이나 폴더 경로 안에 `index.ts`가 재수출하면 RC는 duplicate 오류로 exit 1이고 마이그레이션을 쓰지 않는다. 0.31.11은 `new Set`으로 중복을 제거해 통과한다. 메인테이너 답변은 "배럴이 있으면 배럴 파일 경로를 지정하라"이며 문서 갱신 필요성도 언급했다. | [#6109](https://github.com/drizzle-team/drizzle-orm/issues/6109), [0.31.11 Set](https://github.com/drizzle-team/drizzle-orm/blob/eab8bedbb65d5429c54e612ddbd88aa23091d398/drizzle-kit/src/serializer/pgImports.ts#L100), [rc.5 로더](https://github.com/drizzle-team/drizzle-orm/blob/v1.0.0-rc.5/drizzle-kit/src/dialects/postgres/drizzle.ts#L856-L895), 실험 |
| 경로 기준 | glob 호출에 `cwd` 옵션이 없어 실행 디렉터리 기준으로 보인다. 문서에는 명시가 없고 별도로 실험하지 않았다. | 위 소스 |

## Q3. Relational Queries와 `defineRelations`의 제약

**버전:** `defineRelations`는 v1 RC에만 있다. `0.45.4`의 타입 선언에는 없고 `1.0.0-rc.5`에는 있다(npm 패키지 확인). v1은 RQB v1을 제거했다([v0-v1 변경](https://orm.drizzle.team/docs/v0-v1-changes)). `0.45.4`는 `relations()`와 `drizzle(client, { schema })`를 쓴다.

**공식 문서:**

- "You need to provide all `tables` and `relations` from your schema file/files upon `drizzle()` initialization and then just use the `db.query` API." ([RQB](https://orm.drizzle.team/docs/rqb))
- "In Relational Queries v2, you now have one dedicated place to specify all the relations for all the tables you need." ([v1→v2](https://orm.drizzle.team/docs/relations-v1-v2))
- 분할이 필요하면 `defineRelationsPart`를 쓰고, `drizzle(url, { relations: { ...relations, ...part } })`처럼 메인을 먼저 펼친다. 파트만 쓰려면 빈 파트 `defineRelationsPart(schema)`를 하나 둔다. ([Relations](https://orm.drizzle.team/docs/relations))
- relations는 스키마와 외래 키에 영향을 주지 않는다. "They do not affect the database schema in any way and do not create foreign keys implicitly." (같은 페이지)

**파일 배치 자체를 규정한 문구는 없다.** 예시가 `import * as schema from './schema'`일 뿐이다. [RC 소스](https://github.com/drizzle-team/drizzle-orm/blob/v1.0.0-rc.5/drizzle-orm/src/relations.ts#L1890-L1958)도 받은 객체에서 테이블만 걸러 쓰므로, 인자는 어떤 파일에서 모은 평범한 객체면 된다.

**실험** (`pg-proxy`로 SQL만 생성, 테이블 2개를 서로 다른 모듈 폴더에 배치):

- RC: `defineRelations({ users, concerts }, ...)`처럼 다른 폴더의 테이블을 모으면 정상 동작하고 `tsc`도 통과한다.
- RC: 파트를 모듈별로 나누는 것도 가능하다. 단, 파트 안에 대상 테이블을 함께 넘겨야 한다. 대상이 객체에 없으면 `TypeError`가 난다. 또 역방향이 다른 파트에 있으면 `r.many.x()`에 `from`/`to`를 명시해야 한다. 생략하면 "not enough data provided to build the relation" 오류가 난다.
- RC: `db.query`에는 넘긴 테이블만 나타난다. `db.select().from(concerts)` 같은 쿼리 빌더는 relations에 없는 테이블도 그대로 쓴다.
- 0.45.4: `relations()`는 B처럼 각 파일에 둘 수 있지만, `schema`에 `{ ...users, ...concerts }`로 모아야 한다. 일부만 넘기면 `Table "concerts" not found in schema` 오류가 난다.

**답:** RQB를 쓸 때만 집계가 필요하다. 테이블을 한 파일에 정의할 필요는 없지만, `drizzle()`에 넘길 객체를 만드는 지점은 필요하다. 쿼리 빌더만 쓰면 필요 없다.

**관찰:** B 레포인 [papra](https://github.com/papra-hq/papra/blob/main/apps/papra-server/src/modules/app/database/database.ts)와 [modular-monolith-starter](https://github.com/ihssmaheel-dev/modular-monolith-starter/blob/main/apps/api/src/infrastructure/database/database.service.ts)는 `schema` 없이 `drizzle(client)`로 호출한다. [lombok-web](https://github.com/LombokApp/lombok-web/blob/main/packages/api/src/orm/orm.service.ts)은 `orm.service.ts`의 `dbSchema` 객체에 테이블을 수동으로 모은다. NestJS 문서는 "You declare the relations for the whole schema at once"라며 `db/relations` 파일 하나를 쓴다([문서](https://github.com/nestjs/docs.nestjs.com/blob/master/content/data/drizzle.md)).

**추론:** 모듈별 파트는 어차피 다른 모듈의 테이블을 import해야 하므로 모듈 경계를 크게 지켜 주지 못한다. A든 B든 `src/db/relations.ts` 하나가 가장 단순하다.

## Q4. 파일 간 외래 키와 순환 import

**소스:** `references()`의 인자는 항상 콜백이다. 호출 시점에는 [배열에 저장만 하고](https://github.com/drizzle-team/drizzle-orm/blob/eab8bedbb65d5429c54e612ddbd88aa23091d398/drizzle-orm/src/pg-core/columns/common.ts#L68-L72), [`ref()`는 나중에 실제 참조 정보를 읽을 때 실행된다](https://github.com/drizzle-team/drizzle-orm/blob/eab8bedbb65d5429c54e612ddbd88aa23091d398/drizzle-orm/src/pg-core/columns/common.ts#L101-L105). 그래서 런타임 순환에 안전하다.

**공식 문서:** 자기 참조에 대해서만 다룬다. "If you want to do a self reference, due to a TypeScript limitations you will have to either explicitly set return type for reference callback or use a standalone `foreignKey` operator." ([Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints)) 파일 간 순환을 직접 다룬 문구는 찾지 못했다.

**실험** (`a.schema.ts`와 `b.schema.ts`가 서로 참조):

| 상황 | 결과 |
|---|---|
| 상호 FK, 콜백 form | `generate` 성공. 테이블을 만든 뒤 `ALTER TABLE`로 FK 2개를 추가한다. |
| 같은 상황에서 `tsc`(strict) | TS7022, TS7024 오류. 테이블 타입이 암묵적 `any`가 된다. |
| 한쪽 콜백에 `(): AnyPgColumn =>` 지정 | `tsc` 통과 |
| 순환 안에서 다른 파일의 enum을 컬럼 정의에 즉시 사용 | `generate` 실패. 0.31.11은 `ReferenceError: Cannot access 'kind' before initialization`, RC는 `(0 , _a.kind) is not a function` |

**이슈:**

- [#435](https://github.com/drizzle-team/drizzle-orm/issues/435): 상호 FK의 `any` 추론. 메인테이너가 이미지로 해법을 답하고 닫았다(이미지 내용은 확인하지 못했다). [#2476](https://github.com/drizzle-team/drizzle-orm/issues/2476)도 같은 증상이다.
- [#1308](https://github.com/drizzle-team/drizzle-orm/issues/1308): `.schema` 파일 여러 개 사이의 순환에서 `ReferenceError`. 작성자는 한 파일로 합쳐 우회했다. 메인테이너 답변은 없다.
- [#2993](https://github.com/drizzle-team/drizzle-orm/issues/2993): 상호 FK 인트로스펙션 결과가 타입 오류를 낸다. 협업자가 `rc`에서 수정됐다고 답했다.

**파일 로딩 (소스):** 0.31.11은 esbuild-register 환경에서 [`require`](https://github.com/drizzle-team/drizzle-orm/blob/eab8bedbb65d5429c54e612ddbd88aa23091d398/drizzle-kit/src/serializer/pgImports.ts#L80-L84)로 읽는다. RC는 Node에서 파일마다 [jiti를 `requireCache: false`로 새로 만들어](https://github.com/drizzle-team/drizzle-orm/blob/v1.0.0-rc.5/drizzle-kit/src/utils/utils-node.ts#L472-L482) 읽는다. Kit은 스키마 파일과 그 import 대상을 실제로 실행한다. 실험에서 스키마가 import한 헬퍼의 `console.log`가 `generate` 중에 출력됐다. "Drizzle Kit runs outside your Nest application"([NestJS 문서](https://github.com/nestjs/docs.nestjs.com/blob/master/content/data/drizzle.md))이므로 스키마 파일에서 서비스나 설정 코드를 import하면 문제가 된다. 관련 사례는 [#4208](https://github.com/drizzle-team/drizzle-orm/issues/4208)이다. 로드 중 오류 시 RC가 스택 트레이스를 버리는 문제([#5880](https://github.com/drizzle-team/drizzle-orm/issues/5880))도 열려 있고, 위 실험의 RC 출력도 메시지 한 줄이었다.

**모듈 해석:**

- `.js` 확장자 import 오류 이슈가 열려 있다: [#1561](https://github.com/drizzle-team/drizzle-orm/issues/1561), [#2705](https://github.com/drizzle-team/drizzle-orm/issues/2705), [#3348](https://github.com/drizzle-team/drizzle-orm/issues/3348). 실험의 CommonJS 설정에서는 재현되지 않았다. ESM 설정은 시험하지 않았다.
- tsconfig `@/*` 별칭은 실험에서 동작했다. RC는 `extends`를 따라가지 않거나([#5712](https://github.com/drizzle-team/drizzle-orm/issues/5712)) `"*"` 매핑을 무시한다는([#6593](https://github.com/drizzle-team/drizzle-orm/issues/6593)) 이슈가 열려 있다.

**추론:** enum과 공용 컬럼 헬퍼는 순환 밖 파일에 둔다. 상호 FK는 드물겠지만, 생기면 `AnyPgColumn`을 한쪽에 붙인다. A와 B의 차이는 없다. B는 다른 모듈의 스키마 파일을 직접 import하므로, 모듈 경계 lint를 도입한다면 스키마 파일 예외가 필요하다.

## Q5. 마이그레이션과 정의 파일의 관계

**공식 문서:** 직접 언급은 찾지 못했다. 소스와 실험으로 확인했다.

**소스:** 파일 경로는 테이블 객체를 모으는 데만 쓰인다. 이후 `generate`는 이전 스냅샷과 현재 스키마의 DDL을 비교한다([rc.5 generate](https://github.com/drizzle-team/drizzle-orm/blob/v1.0.0-rc.5/drizzle-kit/src/cli/commands/generate-postgres.ts#L38-L60), [rc.5 serializer](https://github.com/drizzle-team/drizzle-orm/blob/v1.0.0-rc.5/drizzle-kit/src/dialects/postgres/serializer.ts#L11-L39)). 0.31.11의 `pgSchema.ts`와 `pgSerializer.ts`, RC의 `ddl.ts`와 `snapshot.ts`에서 `filename`, `filePath`, `sourceFile`을 검색해도 해당 필드가 없었다.

**실험:**

- 생성된 스냅샷의 최상위 키는 0.31.11이 `id, prevId, version, dialect, tables, enums, schemas, sequences, roles, policies, views, _meta`, RC가 `type, version, dialect, id, prevIds, footprints, ddl`이다. 파일 경로 문자열(`src/`, `.ts"`)은 `drizzle/` 전체를 grep해도 나오지 않았다.
- A 구성으로 마이그레이션을 만들고, 파일을 B 구성으로 옮기고 config를 바꾼 뒤 다시 `generate`했다. 결과는 "No schema changes, nothing to migrate"였고 `drizzle/` 해시도 그대로였다(enum, 인덱스, FK 포함).
- TS 변수명을 `users`에서 `usersTable`로 바꿔도 결과는 같았다.
- **파일 순서는 첫 마이그레이션의 SQL 문 순서에 영향을 준다.** 파일명을 바꿔 로드 순서를 뒤집으면 `CREATE TABLE` 순서가 달라진다. FK는 뒤의 `ALTER TABLE`로 분리되므로 결과 스키마는 같다고 판단한다. 이미 생성된 마이그레이션에는 영향이 없다.
- **glob 밖으로 나간 파일은 삭제로 처리된다.** 파일을 glob 밖으로 옮기고 `generate`하면 경고 없이 `DROP TABLE "k"`(0.31.11은 `CASCADE` 포함)가 생성된다.

**답:** 위치 이동은 새 마이그레이션을 만들지 않는다. 단, 이동 후에도 Kit이 그 파일을 읽을 때만 그렇다. 이동이 포함된 변경에서는 `generate` 결과가 비어 있는지 확인해야 한다.

## Q6. 실제 프로젝트 조사

**선정 방법:**

- **표본 1 (레이아웃과 무관하게 선정, 집계 대상):** NestJS 16개는 `gh search repos 'nestjs drizzle'`, 토픽 `drizzle-orm`+`nestjs`, `@nestjs/core`와 `drizzle-orm`을 함께 가진 `package.json`의 코드 검색에서 골랐다. 2025년 이후 push가 있고 스타 5개 이상인 것을 남기되, 라이브러리와 `nestjs-drizzle`류 데모는 뺐다. 조건에 맞는 후보를 전수 확인하지는 않았다(예: `purshew`, `mini-etl`은 미확인). `ae-zoning-api`는 스타 4개지만 실제 공공 서비스 API여서 예외로 넣었다. 잘 알려진 12개는 내가 아는 Drizzle 사용 프로젝트 목록을 트리로 검증했다.
- **표본 2 (B를 찾으려고 검색, 집계 제외):** `drizzle.config.ts` 안의 `src/modules`, `*.schema.ts`, `*.table.ts` 등을 코드 검색했다.
- 모두 `gh api`로 기본 브랜치 트리와 `drizzle.config`의 `schema` 값, `package.json`을 직접 읽었다(2026-11-07 기준).

**한계:** 비공개 서비스는 볼 수 없다. 스타는 프로덕션 사용을 뜻하지 않으며 NestJS 쪽은 보일러플레이트 비중이 높다. 잘 알려진 12개는 내 선택이라 편향될 수 있고, SQLite와 MySQL 프로젝트(opencode, karakeep, openstatus, unkey, papra 등)와 비NestJS가 섞여 있다. 분류는 config와 경로로 판단했으며 모든 파일을 읽지는 않았다.

**분류 기준:** A는 중앙 폴더에 여러 파일(별도 패키지 포함), B는 기능 모듈 폴더 안에 배치, 단일은 중앙 파일 하나(방언별 파일 포함)다. A 사례는 대부분 테이블 또는 도메인 단위 파일이라, 질문의 "모듈당 한 파일"과 정확히 같지는 않다.

### 집계

| 표본 | A | B | 단일 |
|---|---|---|---|
| NestJS (16) | 10 | 1 | 5 |
| 잘 알려진 프로젝트 (12) | 5 | 1 | 6 |
| **합계 (28)** | **15** | **2** | **11** |

### 표본 1: NestJS + Drizzle

| 레포 | ★ / 최근 push | 관찰 경로 | 분류 |
|---|---|---|---|
| [nestjs/nest](https://github.com/nestjs/nest/tree/master/sample/37-outbox) 샘플 37, 38 (공식) | 77k / 활발 | `sample/37-outbox/src/database/schema.ts`, `sample/38-webhooks/src/database/schema.ts` | 단일 |
| [huajian123/ng-antd-admin](https://github.com/huajian123/ng-antd-admin) | 711 / 2026-10 | `nest-api/src/drizzle/schema.ts` | 단일 |
| [apotdevin/thunderhub](https://github.com/apotdevin/thunderhub) | 468 / 2026-10 | `src/server/modules/database/schema/{pg,sqlite}/*.ts` | A |
| [oNo500/nestjs-boilerplate](https://github.com/oNo500/nestjs-boilerplate) | 93 / 2026-05 | `packages/database/src/schemas/*.schema.ts`, `identity/`, `audit/` | A |
| [Dapta-Tech/dapta-forms](https://github.com/Dapta-Tech/dapta-forms) | 50 / 2026-11 | `packages/db/src/schema.pg.ts`, `schema.sqlite.ts` (`drizzle.config` 없음) | 단일 |
| [baiwumm/better-admin](https://github.com/baiwumm/better-admin) | 35 / 2026-11 | `apps/nest/src/db/schema/*.schema.ts` + `index.ts` | A |
| [DimplesY/nest-api-starter](https://github.com/DimplesY/nest-api-starter) | 13 / 2025-07 | `src/drizzle/schema/*.ts` | A |
| [mguay22/clean-shop](https://github.com/mguay22/clean-shop) | 11 / 2026-07 | `src/shared/infrastructure/database/postgres/schema/*.schema.ts` | A |
| [SlimeVR/SlimeVR-Firmware-WebBuilder](https://github.com/SlimeVR/SlimeVR-Firmware-WebBuilder) | 10 / 2026-10 | `src/db.schema.ts` | 단일 |
| [emrbli/worldcup](https://github.com/emrbli/worldcup) | 9 / 2026-07 | `src/lib/db/schema.ts` + `src/lib/db/schema/*.ts` | A |
| [Friedrich482/mooncode](https://github.com/Friedrich482/mooncode) | 8 / 2026-07 | `apps/api/src/drizzle/schema/*.ts` | A |
| [Gi-jutsu/nestjs-clean-boilerplate](https://github.com/Gi-jutsu/nestjs-clean-boilerplate) | 8 / 2026-10 | `src/modules/*/infrastructure/database/drizzle.schema.ts` | B |
| [Xayrulloh/Family-Tree](https://github.com/Xayrulloh/Family-Tree) | 7 / 2026-09 | `apps/api/src/database/schema.ts` | 단일 |
| [Rabtx/school-os](https://github.com/Rabtx/school-os) | 6 / 2026-11 | `apps/nest-api/src/database/schema/*.schema.ts` (49개) | A |
| [RamosJSouza/secure-nestjs-drizzle-template](https://github.com/RamosJSouza/secure-nestjs-drizzle-template) | 5 / 2026-07 | `src/database/schema/*.schema.ts`, `relations.ts` | A |
| [NYCPlanning/ae-zoning-api](https://github.com/NYCPlanning/ae-zoning-api) | 4 / 2026-10 | `src/schema/*.ts` (28개). 기능 코드는 `src/<feature>/` | A |

**공식 NestJS 자료:** `nestjs/nest`에 Drizzle 샘플이 있다. [`37-outbox`](https://github.com/nestjs/nest/tree/master/sample/37-outbox)와 `38-webhooks`다. 둘 다 `src/orders/`, `src/inventory/` 등 기능 폴더를 두면서 스키마는 `src/database/schema.ts`에 모으고, 37의 별도 프로세스 `analytics-service`만 자기 `src/database/schema.ts`를 갖는다. 다만 테이블이 적은 샘플이다(37의 메인 스키마는 `products`, `orders` 2개). 공식 패키지 [`@nestjs/drizzle`](https://github.com/nestjs/drizzle)(npm 0.0.2, ★22)도 있고, [NestJS 문서](https://github.com/nestjs/docs.nestjs.com/blob/master/content/data/drizzle.md)는 `db/schema`, `db/relations`와 `schema: './src/db/schema.ts'`를 예시로 든다. 파일 구성에 관해 권고하는 문장은 없다. "Unlike the TypeORM integration, Drizzle has no `forFeature()` step."이라고 설명할 뿐이다.

### 표본 1: 잘 알려진 TypeScript 프로젝트

| 레포 | ★ | 관찰 경로 | 분류 |
|---|---|---|---|
| [anomalyco/opencode](https://github.com/anomalyco/opencode) | 225k | `packages/core/src/<domain>/sql.ts`, config는 `["./src/**/*.sql.ts", "./src/**/sql.ts"]` | B |
| [lobehub/lobehub](https://github.com/lobehub/lobehub) | 84k | `packages/database/src/schemas/*.ts` | A |
| [Dokploy/dokploy](https://github.com/Dokploy/dokploy) | 38k | `packages/server/src/db/schema/*.ts` (52개) | A |
| [simstudioai/sim](https://github.com/simstudioai/sim) | 30k | `packages/db/schema.ts` | 단일 |
| [karakeep-app/karakeep](https://github.com/karakeep-app/karakeep) | 30k | `packages/db/schema.ts` | 단일 |
| [onlook-dev/onlook](https://github.com/onlook-dev/onlook) | 27k | `packages/db/src/schema/<domain>/` | A |
| [vercel/chatbot](https://github.com/vercel/chatbot) | 21k | `lib/db/schema.ts` | 단일 |
| [nextjs/saas-starter](https://github.com/nextjs/saas-starter) | 16k | `lib/db/schema.ts` | 단일 |
| [midday-ai/midday](https://github.com/midday-ai/midday) | 15k | `packages/db/src/schema.ts` | 단일 |
| [openstatusHQ/openstatus](https://github.com/openstatusHQ/openstatus) | 9k | `packages/db/src/schema/<domain>/`, config는 `./src/schema/index.ts` | A |
| [unkeyed/unkey](https://github.com/unkeyed/unkey) | 5k | `web/internal/db/src/schema/*.ts`, config는 `./src/schema/index.ts` | A |
| [homarr-labs/homarr](https://github.com/homarr-labs/homarr) | 5k | `packages/db/schema/{postgresql,sqlite}.ts` | 단일 |

### 표본 2: B 사례를 찾아 얻은 레포 (집계 제외)

| 레포 | ★ | 스택 | 관찰 경로 |
|---|---|---|---|
| [papra-hq/papra](https://github.com/papra-hq/papra) | 5.7k | 비Nest | `apps/papra-server/src/modules/<m>/<m>.table(s).ts` |
| [cellajs/cella](https://github.com/cellajs/cella) | 458 | 비Nest, RC 사용 | `backend/src/modules/**/*-db.ts` (33개) |
| [paralect/ship](https://github.com/paralect/ship) | 437 | Hono | `template/apps/api/src/resources/*/*.schema.ts` |
| [LCNINE/almondyoung-server](https://github.com/LCNINE/almondyoung-server) | 70 | NestJS | `apps/core/src/modules/<m>/schema/<m>.schema.ts`, config는 명시적 배열 |
| [vobase/vobase](https://github.com/vobase/vobase) | 61 | 비Nest | `packages/core/src/modules/*/schema.ts` |
| [LombokApp/lombok-web](https://github.com/LombokApp/lombok-web) | 41 | NestJS | `packages/api/src/**/entities/*.entity.ts` (35개) |
| [ihssmaheel-dev/modular-monolith-starter](https://github.com/ihssmaheel-dev/modular-monolith-starter) | 6 | NestJS, 모듈러 모놀리스 자칭 | `apps/api/src/modules/*/infrastructure/schemas/*.schema.ts` |

**그 외:**

- 모듈러 모놀리스를 자칭한 다른 레포 [modular-elysia-commerce](https://github.com/masmuss/modular-elysia-commerce)(0★, `src/modules/*/schema.ts`)와 [ERP-Bem-Comum/core-api](https://github.com/ERP-Bem-Comum/core-api)(0★, `src/modules/*/adapters/persistence/schemas/mysql.ts`, config 미확인)도 B다. 검색에 함께 나온 `labq-modules`는 확인하지 않았다.
- [KirillSachkov/ai-first-platform](https://github.com/KirillSachkov/ai-first-platform)(0★)은 모듈마다 `drizzle.config.ts`와 마이그레이션 스키마를 따로 둔다. 모듈별 독립 마이그레이션이라는 제3의 변형이다.
- [TwiTech-LAB/devchain](https://github.com/TwiTech-LAB/devchain)(NestJS, 133★)은 `src/modules/storage/db/schema.ts`로, `modules` 아래에 있지만 저장소 모듈에 모은 단일 파일이다.

**관찰:** B에서도 모듈 간 스키마 직접 import가 흔하다. opencode의 [`session/sql.ts`](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/session/sql.ts)는 `../project/sql.js`를, papra의 [`documents.table.ts`](https://github.com/papra-hq/papra/blob/main/apps/papra-server/src/modules/documents/documents.table.ts)는 `../users/users.table`과 `../organizations/organizations.table`을 import한다.

## 확인하지 못한 것

- 파일 구성을 권하는 메인테이너 발언. 이슈 검색 범위에서 찾지 못했고, Discord와 discussions는 조사하지 않았다.
- ESM(`type: module`) 환경, DB에 실제 적용한 결과, PostgreSQL 외 방언에서의 실험.
- v1 정식판의 동작. 위 RC 결과, 특히 배럴 중복 오류가 정식판에서 유지되는지는 알 수 없다.
- 표본 레포들의 실제 프로덕션 사용 여부.
