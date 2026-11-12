# 학습 문서

학습한 내용을 브라우저에서 읽는 HTML 문서로 정리한다.

## 폴더와 번호

문서는 주제별 폴더에 둔다. 번호는 폴더마다 `00`부터 두 자리로 이어서 매긴다.

| 폴더 | 주제 |
|---|---|
| `react-next/` | React와 Next.js(훅, 렌더링, 서버 컴포넌트), 스토어 앱 구조, API 호출 |
| `nest/` | NestJS, API 테스트 |
| `zod/` | zod 스키마로 실행 중에 값 검사하기, 타입과 문서 만들기 |
| `db-and-drizzle/` | DB와 SQL 개념, Drizzle 스키마와 쿼리, 마이그레이션 |
| `design-system/` | `store-ui`의 토큰, 컴포넌트, Storybook, 라이브러리 빌드 |
| `style/` | CSS와 Tailwind로 배치하고 꾸미는 패턴(앱과 `store-ui` 공통) |
| `store-logic/` | 스토어 앱이 값을 다루는 로직(주소 쿼리 정리, 주소 만들기, 주소의 값과 화면 컴포넌트의 상태 맞추기 등) |

공통 파일(`learn.css`, `learn.js`, `vendor/`, `index.html`, `template.html`)은 이 폴더 바로 아래에 둔다. 폴더를 새로 만들어야 하면 이 표와 `learn.js`의 `learnFolders`에 먼저 추가한다.

## 새 문서 만들기

1. `template.html`을 주제 폴더에 `번호-주제.html`로 복사한다. 예: `nest/05-가드와-인증.html`.
2. 제목, 목차, 본문을 바꾸고 쓰지 않는 예시를 지운다. 제목(`<title>`, `<h1>`)은 `05 가드와 인증`처럼 번호로 시작한다.
3. `learn.js`의 `learnFolders`에서 그 폴더의 `documents`에 파일 이름, 목록에 보일 이름, 태그를 한 줄 추가한다. 제목 아래 태그, 같은 폴더 앞뒤 문서의 이전/다음 링크, 전체 목록 페이지 `index.html`에 나타난다.

## 쌓아 가는 참고 문서

아래 문서들은 주제별 학습 문서가 아니라 개념과 문법을 모아 두는 참고 문서다. 같은 설명을 문서마다 다시 쓰지 않고, 필요할 때 이 문서들에 절을 더한다.

| 문서 | 모으는 것 |
|---|---|
| `db-and-drizzle/01-프론트엔드-개발자를-위한-DB-개념.html` | Drizzle과 무관한 DB와 SQL 개념(테이블, 기본 키, 외래 키, JOIN, 인덱스, timestamptz 등). 읽는 사람은 DB를 잘 모르는 프론트엔드 개발자로 보고, 개념마다 자바스크립트 비유와 짧은 코드를 붙인다 |
| `db-and-drizzle/02-drizzle-스키마-문법.html` | Drizzle 스키마 파일에 쓰는 문법(빌더, 수식어, `references`, `index`, `pgEnum` 등). 문법마다 코드, 생성되는 SQL, TS 타입에 주는 영향을 적는다. 이 저장소가 왜 그 문법을 골랐는지는 적지 않는다 |
| `db-and-drizzle/03-drizzle-쿼리-문법.html` | 서비스, 시드, 테스트에서 DB를 읽고 쓰는 Drizzle 쿼리 문법(`select`, `innerJoin`, `orderBy`, 집계, 서브쿼리, `insert`, `transaction` 등). 문법마다 이 저장소의 코드, 생성되는 SQL, 결과 타입을 적는다 |
| `db-and-drizzle/08-마이그레이션.html` | 마이그레이션 개념, drizzle-kit 명령의 순서, 실수하기 쉬운 곳, 그리고 이 저장소의 마이그레이션 사례. 마이그레이션을 만들 때마다 `이 저장소의 사례` 절에 `h3`로 한 항목씩 더한다 |
| `style/00-tailwind-배치-패턴.html` | 클래스 몇 개가 함께 있어야 의도대로 배치되는 조합(예: `relative` + `fill` 이미지, `rounded-*` + `overflow-hidden`). 패턴마다 푸는 문제, 만들어지는 CSS, 이 저장소의 사례, 하나를 빼면 생기는 일을 적는다. 리뷰에서 클래스가 왜 붙었는지 설명하면 그 패턴을 `h2` 절로 더하고, 이미 있으면 사례만 더한다 |

- 다른 문서를 쓰다가 설명이 필요한 DB 개념이나 Drizzle 스키마·쿼리 문법이 나오면, 해당 참고 문서에 있는지 먼저 찾는다. 없으면 그 문서에 `h2` 절을 하나 더하고 목차에도 넣는다. 절의 `id`는 짧은 영어로 짓는다(예: `fk`, `index`).
- 쓰고 있는 문서에서는 개념이나 문법을 다시 풀지 않고 `<a href="../db-and-drizzle/01-프론트엔드-개발자를-위한-DB-개념.html#fk">외래 키</a>`처럼 절로 링크한다. 그 문서에는 이 저장소의 코드와 선택의 이유만 쓴다. 예: `db-and-drizzle/04-공연장-공연-회차-스키마.html`.
- 이미 링크된 절의 `id`는 바꾸지 않는다. 바꿔야 하면 `grep -rn "01-프론트엔드\|02-drizzle\|03-drizzle" docs/learn`으로 링크를 함께 고친다.

본문에서 다른 문서를 언급할 때는 `<a href="../nest/02-의존성-주입.html#nest">nest 02 문서</a>`처럼 폴더 이름과 번호로 부르고 링크를 건다. 같은 폴더면 `02-의존성-주입.html`처럼 파일 이름만 쓴다. 가능하면 해당 절의 `id`까지 붙인다.

스타일과 스크립트는 문서에 직접 넣지 않고 템플릿이 불러오는 공통 파일을 쓴다. 테마나 모듈을 바꾸면 모든 문서에 적용되니, 기존 문서가 깨지지 않는지 확인한다.

## 태그

폴더가 주제를 크게 나누고, 태그는 폴더를 넘나드는 주제(예: `testing`, `openapi`)로 문서를 거를 때 쓴다. `index.html`에서 태그별로 문서를 모아 볼 수 있도록 문서마다 태그를 단다. 태그는 HTML에 쓰지 않고 `learn.js`의 `learnFolders`에 적으며, 아래 목록의 이름을 글자 그대로 쓴다. `learn.js`가 제목 아래에 태그를 그리고, 태그를 누르면 `index.html#태그`로 그 태그의 문서만 보인다. 맞는 태그가 없으면 소문자 영어로 된 새 이름을 이 목록에 먼저 추가한다.

| 태그 | 대상 |
|---|---|
| `nestjs` | NestJS의 구조와 사용법 |
| `zod` | zod 스키마의 문법과 동작 |
| `drizzle` | Drizzle ORM의 스키마, 마이그레이션, 쿼리 |
| `database` | Drizzle과 무관한 DB와 SQL 개념(테이블, 키, JOIN, 인덱스 등) |
| `testing` | 테스트 구성, 도구, 작성 방법 |
| `nextjs` | Next.js의 렌더링, 캐시, 앱 구조 |
| `openapi` | OpenAPI 계약, 생성 클라이언트, API 호출 방식 |
| `design-system` | `store-ui`의 토큰, 컴포넌트, Storybook |
| `base-ui` | Base UI의 API와 동작(`useRender`, 컴포넌트 부품, 데이터 속성 등) |
| `css` | CSS와 Tailwind의 배치, 꾸미기 패턴 |
| `url-state` | 화면 상태(검색어, 정렬, 페이지)를 주소의 쿼리에 담고 읽고 만드는 방식 |
| `react` | React의 상태와 훅, 렌더링 동작(제어·비제어 컴포넌트, `key`, transition 등) |

## 모듈

사용 예시는 `template.html`에 있다.

모듈이 표현하려는 내용에 맞지 않으면 내용을 줄이거나 문서 안에서 스타일로 피해 가지 않는다. 기존 모듈을 고쳐 그 경우를 지원하거나 새 모듈을 만든다. 예를 들어 트리가 깊이 제한에 걸리면 단계를 합치지 않고 트리 모듈이 더 깊은 단계를 지원하게 고친다. 모듈을 고치거나 추가하면 `learn.css`, 아래 표, `template.html` 예시를 함께 바꾼다.

| 모듈 | 클래스 | 용도 |
|---|---|---|
| 문서 틀 | `layout`, `lead` | 목차와 본문 배치, 제목 아래 요약 |
| 소제목 | `h3`, `h4` | 절 안을 나눌 때 `h3`, `h3` 안을 다시 나눌 때 `h4` |
| 문서 탐색 | `doc-nav`, `doc-nav-kind` | 목차 아래의 같은 폴더 이전/다음 문서와 전체 목록 링크. `learn.js`가 그리므로 문서에 직접 쓰지 않는다 |
| 전체 목록 | `layout single`, `doc-group`, `doc-index` | `index.html`의 한 열 배치와 폴더별로 묶은, 태그로 거를 수 있는 전체 문서 목록. 목록은 `learn.js`가 채운다 |
| 태그 | `tags`, `tag-filter` | 문서 주제 표시와 `index.html`의 태그 필터. `learn.js`가 그린다 |
| 흐름도 | `flow`, `lane`, `lane-title`, `chain` | 전체 흐름을 한눈에 보여 주기 |
| 단계 | `steps` | 번호를 매긴 순서 설명. 항목의 첫 `strong`이 단계 제목이 되고, 본문 안의 `strong`은 문장 속 강조로 남는다 |
| 트리 | `tree`, `tree-row`, `tree-node`, `tree-note` | 연결선이 있는 계층 구조와 오른쪽 설명. 설명 열은 깊이와 상관없이 맞춰진다. 이름이 길면 `style="--tree-col: 17rem"`처럼 이름 열을 넓힌다 |
| 표 | `table-wrap` | 좁은 화면에서 가로로 스크롤되는 표 |
| 배지 | `badge` | 표나 문장 안의 짧은 분류 |
| 강조 상자 | `callout`, `callout warn` | 핵심 정의, 주의할 점 |
| 접는 본문 | `details.fold`, `fold-body` | 코드나 표가 든 선택 읽기 내용 |
| 문제 | `quiz`, `quiz-q`, `quiz-context`, `quiz-answer` | 맥락(관련 절, 바꾸는 코드, 데이터)이 필요한 자가 점검 문제. 질문과 맥락은 펼쳐 두고 답만 접는다 |

`lane`, `steps`, `badge`에는 색을 정하는 클래스를 함께 붙인다. `blue`와 `green`이 있다.

코드 블록에 `<pre><code class="language-ts">`처럼 언어를 지정하면 highlight.js가 구문을 강조한다. 오류 메시지처럼 코드가 아닌 블록에는 붙이지 않는다. 코드 블록의 긴 줄은 가로 스크롤 없이 줄바꿈되므로, 읽기 좋게 하려고 일부러 짧게 자르지 않아도 된다.

자가 점검 문제는 `quiz`로 쓴다. `quiz-q`에 질문을, `quiz-context`에 어느 절의 무엇을 묻는지를 적고, 바꾸는 코드는 `language-diff` 코드 블록으로, 필요한 데이터는 표로 질문 아래에 둔다. 답만 `<details class="quiz-answer">` 안의 `fold-body`에 접는다. 질문 한 줄만으로 무엇을 묻는지 분명할 때만 클래스 없는 `<details>`를 쓴다. 그 밖에 문단만 접어 둘 때도 클래스 없이 `<details>`를 쓴다. 코드나 표가 든 선택 읽기 내용을 접을 때는 `<details class="fold">` 안에 `<div class="fold-body">`를 두고, 접어도 흐름이 이어지도록 결론은 접기 밖에 적는다.

## 외부 라이브러리

`vendor/highlightjs/`는 npm 패키지 `@highlightjs/cdn-assets` 11.12.0의 `highlight.min.js`와 `LICENSE`를 그대로 복사한 것이다. 빌드 없이 오프라인에서 열기 위해 저장소에 포함한다. 파일을 직접 고치지 말고, 올릴 때는 패키지의 파일로 교체한다.
