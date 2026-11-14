# 스토어 화면은 `apps-src/`에 URL과 같은 경로로 두고, `app/`은 라우트 연결만 한다

스토어(`apps/store`)의 화면 구현은 `apps-src/`에 둔다. `app/`의 라우트 파일(`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`)은 `params`와 `searchParams`를 await해 넘기고, `generateMetadata`처럼 Next가 정한 export만 둔다. 데이터 로딩, `notFound()`와 `redirect()` 판단, 화면은 모두 `apps-src/`의 페이지 파일에 있다. 화면을 고칠 때는 `apps-src/`만 연다.

`apps-src/` 안의 경로는 URL을 그대로 따른다. `/`는 `_index/`, `/shows/[id]`는 `shows/[id]/`이고, 루트 레이아웃은 `_layout/`이다. `_`는 URL 세그먼트가 아닌 폴더에만 붙인다. 페이지 파일은 `<화면 이름>-page.tsx`(예: `show-detail-page.tsx`)로 짓는다. IDE 탭, 검색, 스택 트레이스처럼 파일 이름만 보이는 곳에서도 어느 화면인지 알 수 있다. 라우트 특수 파일의 구현은 같은 폴더에 `<화면 이름>-page.<특수 파일>.tsx`(예: `show-detail-page.loading.tsx`)로 둔다.

하위 컴포넌트는 smart와 dumb을 가리지 않고 모두 sub다. `X`의 하위 컴포넌트는 `X.sub/`에 두고, `X`만 쓰는 함수는 `X.helper.ts`(둘 이상이면 `X.helper/`)에 둔다. 이 규칙은 페이지부터 맨 아래 컴포넌트까지 같다. 나누는 기준은 줄 수가 아니라 세 가지다. 화면에서 이름을 붙일 수 있는 영역(공연 정보, 회차 패널), `'use client'` 경계, 자기 데이터나 Suspense 경계. 어디에도 해당하지 않는 작은 조각은 같은 파일에 둔다.

여러 페이지가 쓰는 코드는 쓰는 페이지들의 가장 가까운 공통 조상 폴더의 `@shared/`에 둔다. 페이지가 형제로 나란히 있으므로 공통 조상이 분명하다. 루트 `apps-src/@shared/`는 네 갈래다. `api/`(API 클라이언트와 요청 함수, API 호출은 여기에만 있다), `helper/<주제>/`(공연을 모르는 함수, 예: `helper/date/format-kst.ts`), `ui/`(공연을 모르는 조합 컴포넌트, 예: `filter-bar-button.tsx`), `feature/<도메인>/`(여러 페이지가 쓰는 도메인 코드, 예: `feature/show/sub/show-search.tsx`, `feature/show/helper/genre.ts`)다. 하위 `@shared/`는 `helper/`와 `feature/`만 가진다. `feature/` 아래 폴더와 `helper/` 안 파일은 `GLOSSARY.md`의 용어로 짓는다. 의존은 페이지 → feature → helper·ui → api 방향으로만 흐른다. 별칭은 `@shared/*`(루트 `@shared`)와 `@apps-src/*`(`app/`이 페이지를 가져올 때) 둘이다.

## 기각한 대안

- **라우트 폴더 옆 private folder(`app/shows/[id]/_detail/`)와 `src/`**: App Router에서 루트 라우트 폴더 `app/`은 다른 모든 라우트를 품는다. 그래서 `/` 전용 코드와 앱 전체 공용 코드가 같은 높이에 놓이고, 목록과 상세가 함께 쓰는 코드의 자리가 애매하다. `app/` 안에 공용 폴더를 두려 해도 `@shared`는 parallel route slot(`@folder`)으로 해석되어 쓸 수 없다. 화면을 `app/`과 `apps-src/`로 나누는 비용은 `app/` 쪽 파일을 몇 줄짜리 연결 코드로 묶어 줄였다.
- **Feature-Sliced Design(pages, entities, shared 레이어)**: 화면 하나가 레이어 다섯 개로 흩어져, 상세 화면 하나를 고치는 데 여러 폴더를 오간다. 이 구조는 "라우트 연결 / 화면 구현" 두 단계뿐이고, 화면 하나의 코드는 `apps-src/` 안 한 폴더에 모인다.
- **기술 유형별 폴더(`components/`, `hooks/`, `constants/`)**: 한 화면의 코드가 유형별 폴더에 흩어져, 어디를 고쳐야 하는지 폴더 구조가 알려 주지 않는다.
- **smart/dumb 분리(`.ui/`)**: 로직이 조금 붙는 순간 경계가 흔들려 같은 컴포넌트를 두고 위치가 갈린다. 모든 하위 컴포넌트를 sub로 보면 위치가 하나로 정해진다. `@shared/ui/`는 "공연을 모르는가"로 나누므로 이 문제가 없다.
- **멀티 뷰 폴더(`.views/`)**: 탭이나 스텝처럼 완전히 다른 화면은 App Router에서 라우트(또는 searchParams)로 나눈다. URL이 없는 조건부 화면은 sub 하나로 충분하다.
- **줄 수 기준(500줄을 넘으면 분리)**: 줄 수는 화면 구조를 말해 주지 않는다. 작아도 클라이언트 경계면 나누고, 길어도 한 영역이면 둔다.
- **helper와 utils 분리**: 함수가 공연을 아는지는 위치가 이미 말해 준다. `feature/`와 `X.helper.ts`는 도메인 함수, `@shared/helper/`는 공연을 모르는 함수다. 이름을 둘로 나눌 필요가 없다.
- **`page.tsx`라는 이름으로 구현 두기**: App Router가 정한 이름이라 모든 페이지가 같은 파일 이름이 된다. 구현을 `apps-src/`로 옮기면서 화면 이름을 붙였다.
