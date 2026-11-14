# 스토어 코드는 쓰는 라우트 옆에 두고, 여러 라우트가 함께 쓰는 것만 `src/`에 둔다

스토어(`apps/store`)의 코드는 그것을 쓰는 곳에 따라 놓는다. 한 라우트만 쓰는 컴포넌트와 함수는 그 라우트 폴더의 private folder(`_`로 시작해 라우팅에서 빠지는 폴더, 예: `app/shows/[id]/_detail/`)에 둔다. 둘 이상의 라우트나 레이아웃이 쓰게 되면 `src/`로 옮긴다. `src/`는 `app/`을 import하지 않고, 라우트끼리는 서로의 `_` 폴더를 import하지 않는다. API 호출은 `src/api/`에만 둔다. 클라이언트를 만들고, `unwrap`으로 오류를 바꾸고, API 모듈마다 요청 함수를 두는 파일(`src/api/shows.ts`)이 모두 여기에 있다. 다른 곳은 `client.GET`을 부르지 않고 이 함수만 쓴다.

함수는 [Josh W. Comeau의 helper와 utils 구분](https://www.joshwcomeau.com/react/file-structure/)을 따른다. helper는 이 프로젝트에서만 뜻이 있는 함수다. 한 컴포넌트만 쓰면 그 옆 `<컴포넌트>.helpers.ts`(예: `_detail/show-detail.helpers.ts`의 select 함수)에 두고, 여러 라우트가 쓰면 `src/helpers/<주제>.helpers.ts`(예: 장르 이름과 판매 상태 배지를 정하는 `src/helpers/show.helpers.ts`)로 옮긴다. utils는 공연이나 예매를 모르고 다른 프로젝트에 그대로 가져가도 되는 함수(예: ISO 일시를 한국 날짜와 시각 글자로 바꾸는 `formatKst`)이며 `src/utils.ts`에 둔다. `app/`에서 `src/`는 `@/` 별칭으로 가리킨다.

Feature-Sliced Design(pages, entities, shared 레이어)도 검토했지만 이 규모에서는 택하지 않았다. App Router에서는 라우트 폴더가 이미 화면 하나를 모으는 단위다. 그런데 FSD를 쓰면 같은 화면이 `app/`의 라우트와 `pages/` 슬라이스로 갈라지고, 상세 화면 하나를 고치는 데 다섯 폴더를 오가게 된다. 화면과 함께 쓰는 행동(검색, 예매)이 늘어 `src/`가 커지면 그때 `src/` 안만 나누면 된다. 라우트 쪽은 그대로 둔다. 공연 목록 화면의 코드는 아직 `src/shows/`에 있으며 이 규칙대로 옮길 대상이다.
