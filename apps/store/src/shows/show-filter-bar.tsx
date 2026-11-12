'use client';

import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { startTransition, useOptimistic } from 'react';
import { ChevronDownIcon, FilterBarButton } from './filter-bar-button';
import { isWideScreen } from './picker-sheet';
import { getGenreChipLabel, getStatusChipLabel } from './show-filter-items';
import { type FilterSection, ShowFilterSheet } from './show-filter-sheet';
import {
  getFilterApplyHref,
  getSortChangeHref,
  type ShowListQuery,
  type ShowSort,
} from './show-list-query';
import { ShowSortSheet } from './show-sort-sheet';

// 공연 목록의 필터 줄. NOL 티켓 모바일 검색 결과처럼 왼쪽에 장르·판매 상태 칩을 두고(넘치면 가로 스크롤), 오른쪽에 필터와 정렬 버튼을 고정한다.
// 칩과 필터 버튼은 같은 필터 창(ShowFilterSheet)을, 정렬 버튼은 정렬 창(ShowSortSheet)을 연다. 칩으로 열면 그 칩의 부분으로 스크롤한다.
// 창은 overlay-kit의 `overlay.openAsync`로 열고, 창이 돌려준 결과(적용한 쿼리, 고른 정렬, 닫기면 null)로 주소를 바꾼다.
// 창 종류(좁으면 바텀 시트, 넓으면 대화상자)는 여는 순간 `isWideScreen()`으로 한 번만 정한다. 창이 열린 뒤 화면 폭이 바뀌어도 그대로 둔다.
// 열림 상태와 임시 값은 창이 가지므로 이 컴포넌트는 여는 일과 결과를 적용하는 일만 한다.
// 칩 이름은 고른 값(예: "뮤지컬,연극")이고, 필터가 하나라도 걸려 있으면 필터 버튼에 점을 단다.
//
// 주소는 router.replace로 바꿔 방문 기록을 쌓지 않는다. 필터를 여러 번 바꾼 뒤에도 뒤로 가기 한 번이면 목록에 오기 전 화면으로 간다.
// 주소에는 남기므로 새로고침, 공유, 상세에서 돌아오기에서도 필터가 그대로다. NOL 티켓 검색 결과의 필터도 이렇게 동작한다.
// 칩 이름과 필터 점은 서버가 새 목록을 그릴 때까지 기다리지 않도록 useOptimistic으로 적용한 쿼리를 먼저 보인다.
// 필터 창은 이 보이는 쿼리로 채워, 적용 직후 응답 전에 다시 열어도 방금 고른 값이 보인다.
export function ShowFilterBar({ query }: { query: ShowListQuery }) {
  const router = useRouter();
  const [shownQuery, setShownQuery] = useOptimistic(query);
  const hasFilter = shownQuery.genre.length > 0 || shownQuery.status.length > 0;

  async function openFilterSheet(section: FilterSection) {
    const wide = isWideScreen();
    const next = await overlay.openAsync<ShowListQuery | null>(
      ({ isOpen, close, unmount }) => (
        <ShowFilterSheet
          controller={{ wide, isOpen, close, unmount }}
          initialQuery={shownQuery}
          section={section}
        />
      ),
    );
    if (next === null) return;
    applyQuery({ next, href: getFilterApplyHref(next) });
  }

  async function openSortSheet() {
    const wide = isWideScreen();
    const sort = await overlay.openAsync<ShowSort | null>(
      ({ isOpen, close, unmount }) => (
        <ShowSortSheet
          controller={{ wide, isOpen, close, unmount }}
          currentSort={shownQuery.sort}
        />
      ),
    );
    if (sort === null) return;
    applyQuery({
      next: { ...shownQuery, sort },
      href: getSortChangeHref({ query: shownQuery, sort }),
    });
  }

  // 창이 돌려준 결과를 먼저 보이고 주소를 바꾼다. 같은 transition이라 새 목록이 올 때까지 보인 값이 남는다.
  function applyQuery({ next, href }: { next: ShowListQuery; href: string }) {
    startTransition(() => {
      setShownQuery(next);
      router.replace(href);
    });
  }

  return (
    <div className="flex items-center gap-sm">
      <div className="flex min-w-0 flex-1 scrollbar-none gap-sm overflow-x-auto">
        <FilterBarButton
          selected={shownQuery.genre.length > 0}
          onClick={() => {
            void openFilterSheet('genre');
          }}
        >
          <span className="max-w-[160px] truncate">
            {getGenreChipLabel(shownQuery.genre)}
          </span>
          <ChevronDownIcon />
        </FilterBarButton>
        <FilterBarButton
          selected={shownQuery.status.length > 0}
          onClick={() => {
            void openFilterSheet('status');
          }}
        >
          <span className="max-w-[160px] truncate">
            {getStatusChipLabel(shownQuery.status)}
          </span>
          <ChevronDownIcon />
        </FilterBarButton>
      </div>
      <FilterBarButton
        onClick={() => {
          void openFilterSheet('top');
        }}
      >
        <FilterIcon />
        필터
        {hasFilter && (
          <>
            <span
              aria-hidden="true"
              className="absolute top-[6px] right-[8px] size-[6px] rounded-full bg-primary"
            />
            <span className="sr-only">적용됨</span>
          </>
        )}
      </FilterBarButton>
      <FilterBarButton
        onClick={() => {
          void openSortSheet();
        }}
      >
        <SortIcon />
        정렬
      </FilterBarButton>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="size-[16px] shrink-0"
    >
      <path d="M2 4.5h7M12 4.5h2M2 11.5h2M7 11.5h7" />
      <circle cx="10.5" cy="4.5" r="1.5" />
      <circle cx="5.5" cy="11.5" r="1.5" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[16px] shrink-0"
    >
      <path d="M5 13V3M2.5 5.5L5 3l2.5 2.5M11 3v10M8.5 10.5L11 13l2.5-2.5" />
    </svg>
  );
}
