# 스토어 페이지 구조

스토어(`apps/store`)에서 파일을 어디에 두고 페이지 컴포넌트를 어떻게 쓰는지 정한다. 이렇게 정한 이유와 기각한 대안은 [ADR 0008](adr/0008-store-file-structure.md)에 있다.

목표는 두 가지다. 폴더 구조만 보고 화면이 어떻게 생겼는지 떠올릴 수 있어야 하고, 화면의 한 부분을 고칠 때 어느 파일을 열어야 하는지 바로 알 수 있어야 한다.

## 전체 모양

```
apps/store/
├── app/                                   ← 라우트 연결만 한다
│   ├── layout.tsx  error.tsx  globals.css
│   ├── page.tsx  loading.tsx              → apps-src/_index/
│   └── shows/[id]/ page.tsx  loading.tsx  not-found.tsx   → apps-src/shows/[id]/
└── apps-src/                              ← 화면 구현
    ├── @shared/                           ← 여러 페이지가 쓰는 코드
    │   ├── api/                           ← API 클라이언트와 요청 함수
    │   ├── helper/date/format-kst.ts      ← 공연을 모르는 함수
    │   ├── ui/filter-bar-button.tsx       ← 공연을 모르는 컴포넌트
    │   └── feature/show/                  ← 여러 페이지가 쓰는 공연 도메인 코드
    │       ├── helper/  genre.ts  sales-status.ts  show-list-query.ts …
    │       └── sub/     show-search.tsx  show-list-search-form.tsx
    ├── _layout/  root-layout.tsx  root-layout.error.tsx
    ├── _index/                            ← `/` 공연 목록
    │   ├── index-page.tsx
    │   ├── index-page.helper.ts
    │   ├── index-page.loading.tsx
    │   └── index-page.sub/
    │       ├── show-card.tsx
    │       ├── show-list-pagination.tsx
    │       └── show-filter-bar/
    │           ├── show-filter-bar.tsx
    │           ├── show-filter-bar.helper/  filter-items.ts  sort-items.ts
    │           └── show-filter-bar.sub/     show-filter-sheet.tsx  show-sort-sheet.tsx  picker-sheet.tsx
    └── shows/[id]/                        ← `/shows/[id]` 공연 상세
        ├── show-detail-page.tsx
        ├── show-detail-page.helper.ts
        ├── show-detail-page.loading.tsx
        ├── show-detail-page.not-found.tsx
        └── show-detail-page.sub/
            ├── show-detail-layout.tsx
            ├── show-info/  show-info.tsx  show-info.sub/collapsible-detail-images.tsx
            ├── performance-panel.tsx
            ├── performance-sheet.tsx
            └── performance-calendar.tsx
```

## `app/`: 라우트 연결

`app/`의 파일에는 Next가 정한 일만 둔다. `params`와 `searchParams`를 await해 넘기기, `generateMetadata`나 `metadata` 같은 Next export, `globals.css` import가 여기에 해당한다. 데이터를 부르거나 무엇을 그릴지 판단하는 코드는 두지 않는다.

```tsx
// app/shows/[id]/page.tsx
export async function generateMetadata({ params }: PageProps<'/shows/[id]'>): Promise<Metadata> {
  return getShowDetailMetadata((await params).id);
}

export default async function Page({ params }: PageProps<'/shows/[id]'>) {
  return <ShowDetailPage id={(await params).id} />;
}
```

`loading.tsx`, `not-found.tsx`처럼 props가 없는 특수 파일은 default로 다시 내보내기만 한다. `error.tsx`는 클라이언트 컴포넌트여야 하므로 `'use client'`를 함께 둔다.

```tsx
// app/shows/[id]/loading.tsx
export { ShowDetailPageLoading as default } from '@apps-src/shows/[id]/show-detail-page.loading';
```

## `apps-src/`: 페이지

- **경로는 URL을 따른다.** `/shows/[id]`의 구현은 `apps-src/shows/[id]/`에 있다. `/`는 `_index/`, 루트 레이아웃은 `_layout/`이다. `_`는 URL 세그먼트가 아닌 폴더에만 붙인다.
- **페이지 파일은 `<화면 이름>-page.tsx`로 짓는다.** 예: `show-detail-page.tsx`, `index-page.tsx`. 이 파일 이름으로 다른 파일 이름을 만든다. 같은 이름이 다른 도메인에도 있으면 부모 맥락을 붙인다.
- **특수 파일의 구현은 `<화면 이름>-page.<특수 파일>.tsx`로 같은 폴더에 둔다.** 예: `show-detail-page.loading.tsx`, `show-detail-page.not-found.tsx`.
- **컴포넌트 이름에는 맥락을 넣는다.** 파일 이름은 폴더가 맥락을 주므로 짧게 짓고, export하는 컴포넌트는 `ShowDetailPage`, `ShowDetailPageLoading`처럼 어디서 import해도 뜻이 통하게 짓는다.

## sub와 helper

하위 컴포넌트는 smart와 dumb을 가리지 않고 모두 sub다. `X`의 하위 컴포넌트는 `X.sub/`에, `X`만 쓰는 함수는 `X.helper.ts`에 둔다. 이 규칙은 페이지(`show-detail-page.sub/`)에서도, 그 아래 컴포넌트(`show-info.sub/`)에서도 똑같다.

**나누는 기준은 줄 수가 아니다.** 아래 셋 중 하나에 해당하면 sub로 나누고, 해당하지 않는 작은 조각(스타일만 다른 래퍼, 한 번 쓰는 틀)은 같은 파일 아래쪽에 둔다.

1. 화면에서 이름을 붙일 수 있는 영역이다. 예: 공연 정보(`show-info`), 회차 패널(`performance-panel`). 폴더 이름만 보고 화면을 떠올릴 수 있어야 한다.
2. `'use client'` 경계다. 상호작용 때문에 클라이언트 컴포넌트가 되는 부분은 경계가 파일로 보이게 나눈다. 예: `performance-calendar.tsx`, `collapsible-detail-images.tsx`.
3. 자기 데이터나 Suspense 경계를 가진다.

**처음에는 파일 하나로 두고, 딸린 파일이 생기면 폴더로 바꾼다.**

```
show-detail-page.sub/
├── performance-panel.tsx              ← 딸린 파일이 없으면 파일 하나
└── show-info/                         ← 자기 sub가 생겨 폴더로 바꿈
    ├── show-info.tsx
    └── show-info.sub/collapsible-detail-images.tsx
```

helper도 같다. 하나면 `X.helper.ts`로 두고, 둘 이상이면 `X.helper/` 폴더에 개념 이름으로 둔다(예: `show-filter-bar.helper/filter-items.ts`). 폴더 이름이 이미 helper라서 안의 파일에는 `.helper`를 다시 붙이지 않는다. 테스트는 검증하는 파일 옆에 `*.spec.ts`로 둔다.

helper에는 그 컴포넌트만 쓰는 함수, 상수, 훅을 함께 둔다. 상수 파일(`constants.ts`)이나 타입 파일(`types.ts`)을 따로 만들지 않는다. 여러 sub가 함께 쓰는 타입은 그 sub들의 부모 helper에서 export한다(예: `ShowDetailData`는 `show-detail-page.helper.ts`).

## `@shared`: 여러 페이지가 쓰는 코드

두 곳 이상이 쓰게 되면 그 둘의 가장 가까운 공통 조상 폴더의 `@shared/`로 옮긴다. 한 곳만 쓰는 코드는 `@shared`에 미리 두지 않는다. 옮길 때는 `git mv`로 이력을 남긴다.

| 위치 | 두는 것 | 예 |
| --- | --- | --- |
| `@shared/api/` | API 클라이언트, 오류 변환, API 모듈마다 요청 함수. API 호출은 여기에만 있다. | `shows.ts`의 `fetchShows` |
| `@shared/helper/<주제>/` | 공연이나 예매를 모르는 함수. 다른 프로젝트에 그대로 가져가도 된다. | `date/format-kst.ts` |
| `@shared/ui/` | 공연을 모르는 조합 컴포넌트. 기본 부품(Button, Sheet)은 `@openrun/store-ui`에 있다. | `filter-bar-button.tsx` |
| `@shared/feature/<도메인>/helper/` | 여러 페이지가 쓰는 도메인 함수와 상수 | `show/helper/genre.ts` |
| `@shared/feature/<도메인>/sub/` | 여러 페이지나 레이아웃이 쓰는 도메인 컴포넌트 | `show/sub/show-search.tsx` |

- `feature/` 아래 폴더와 `feature/*/helper/` 안 파일은 `GLOSSARY.md`의 용어로 짓는다. 예: 장르는 `genre.ts`, 공연 기간은 `show-period.ts`. 회차처럼 공연에 딸린 개념은 `feature/show/`에 두고, 회차만의 공용 코드가 늘면 그때 `feature/performance/`로 나눈다.
- 하위 `@shared/`(예: `shows/@shared/`)는 `shows/` 아래 페이지끼리 공유할 때 만들고, `helper/`와 `feature/`만 가진다. `api/`는 루트에만 있다.
- 의존은 페이지 → `feature` → `helper`, `ui` → `api` 방향으로만 흐른다. `api`는 `feature`의 타입을 가져오지 않고 API 스키마 타입(`@openrun/api-client`)을 쓴다. 목록 쿼리를 API 쿼리로 바꾸는 일(`getFetchShowsQuery`)은 `feature` 쪽에 있다.
- 루트 `@shared`는 `@shared/*` 별칭으로, 같은 페이지 트리 안은 상대 경로로 import한다. `app/`은 `@apps-src/*`로 페이지를 가져온다. 라우트끼리는 서로의 폴더를 import하지 않는다. 같이 쓰게 되면 `@shared`로 옮긴다.
- barrel 파일(`index.ts`)로 다시 내보내지 않는다. 실제 파일을 직접 import한다.

## 페이지 컴포넌트 작성법

페이지 컴포넌트만 읽어도 그 화면이 어떤 데이터를 쓰고, 어떤 영역으로 나뉘고, 언제 404나 다른 주소로 보내는지 알 수 있어야 한다. 별도 설명 문서가 필요 없도록 페이지 파일 자체가 테크스펙 역할을 한다.

```tsx
// apps-src/shows/[id]/show-detail-page.tsx
// 1. 데이터: 무엇을 어디서 부르고, 없으면 어떻게 되는지
const loadShowDetail = cache(async (id: string) => {
  await connection();                       // 요청마다 렌더링한다. 판매 상태는 실시간이어야 한다.
  const showId = Number(id);
  if (String(showId) !== id) notFound();
  try {
    return selectShowDetail(await fetchShowDetail({ client: createServerApiClient(), id: showId }));
  } catch (error) {
    if (error instanceof ApiError && error.code === 'SHOW_NOT_FOUND') notFound();
    throw error;
  }
});

// 2. 구조: 어떤 영역이 어디에 놓이고 어떤 데이터를 받는지
export async function ShowDetailPage({ id }: { id: string }) {
  const show = await loadShowDetail(id);
  const performances = show.isSalesEnded ? <p>판매가 종료된 공연입니다</p> : <PerformanceCalendar days={show.performanceDays} />;

  return (
    <ShowDetailLayout
      info={<ShowInfo show={show} />}
      panel={<PerformancePanel>{performances}</PerformancePanel>}
      bottomBar={<PerformanceSheet showTitle={show.title} isSalesEnded={show.isSalesEnded}>{performances}</PerformanceSheet>}
    />
  );
}
```

- **데이터는 서버 컴포넌트에서 await한다.** API 함수(`@shared/api/`)로 받은 값은 select 함수(`*.helper.ts`)로 화면 값으로 바꾼 뒤 sub에 props로 넘긴다. 어떤 API를 쓰는지 페이지 파일에서 보인다. `generateMetadata`와 페이지가 같은 값을 쓰면 `cache`로 묶어 한 번만 부른다.
- **흐름을 끊는 판단은 페이지에 둔다.** 없는 공연이면 `notFound()`, 잘못된 쿼리면 정리한 주소로 `redirect()`처럼, 화면 대신 다른 결과를 내는 분기는 데이터를 받은 자리에서 바로 한다.
- **로딩과 오류는 특수 파일로 표현한다.** 기다리는 화면은 `<화면 이름>-page.loading.tsx`, 없는 대상은 `.not-found.tsx`, 렌더링 오류는 `root-layout.error.tsx`다. 로딩 화면은 실제 화면과 같은 틀(예: `ShowDetailLayout`)에 스켈레톤을 넣어, 응답이 와도 자리가 흔들리지 않게 한다. 영역 하나만 따로 기다려야 하면 그 영역을 sub로 나누고 `<Suspense>`로 감싼다.
- **레이아웃은 이름 있는 자리로 보인다.** 영역을 `info`, `panel`, `bottomBar`처럼 이름 있는 props로 받는 레이아웃 sub를 두면, 페이지 JSX만 보고 배치를 알 수 있다. 의미 없는 래퍼를 겹겹이 쌓지 않는다.
- **상호작용은 클라이언트 sub로 내린다.** 페이지 파일은 서버 컴포넌트로 두고, 상태나 이벤트가 필요한 부분만 `'use client'` sub로 나눈다. 그 sub가 자기 상태(예: 달력에서 고른 날짜)를 가진다. 페이지가 모든 하위 상태를 들고 내려보내지 않는다.
- **데이터를 한 번에 모두 기다리지 않는다.** 영역마다 쓰는 데이터가 다르고 응답 속도가 다르면, 영역별 sub가 자기 데이터를 부르고 각자 Suspense 경계를 갖게 나눈다. 페이지는 영역을 배치하기만 한다.
