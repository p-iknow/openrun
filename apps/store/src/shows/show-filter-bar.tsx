'use client';

import { Button, Drawer, ToggleGroup } from '@openrun/store-ui';
import { useRouter } from 'next/navigation';
import { startTransition, useCallback, useOptimistic, useState } from 'react';
import { ChevronDownIcon, FilterBarButton } from './filter-bar-button';
import {
  GENRE_ITEMS,
  getGenreChipLabel,
  getStatusChipLabel,
  STATUS_ITEMS,
} from './show-filter-items';
import {
  getFilterApplyHref,
  getGenreChangeQuery,
  getStatusChangeQuery,
  type ShowListQuery,
} from './show-list-query';
import { ShowSortSheet } from './show-sort-sheet';

/** 시트를 열 때 보여 줄 부분. 필터 버튼으로 열면 맨 위부터 보인다. */
type FilterSection = 'top' | 'genre' | 'status';

// 좁은 화면의 필터 줄. NOL 티켓 모바일 검색 결과처럼 왼쪽에 장르·판매 상태 칩을 두고(넘치면 가로 스크롤), 오른쪽에 필터와 정렬 버튼을 고정한다.
// 칩과 필터 버튼은 같은 필터 시트를 연다. 칩으로 열면 그 칩의 부분으로 스크롤한다.
// 칩 이름은 고른 값(예: "뮤지컬,연극")이고, 필터가 하나라도 걸려 있으면 필터 버튼에 점을 단다.
//
// 시트에서 고른 값은 주소와 따로 둔 임시 쿼리(draft)에만 두고 "적용"으로 한 번에 주소에 반영한다.
// 칩 줄처럼 누를 때마다 주소를 바꾸면 시트에 가린 목록이 칩마다 다시 그려지기 때문이다. NOL 티켓 모바일 필터 시트도 이렇게 동작한다.
// 임시 쿼리는 칩 줄과 같은 함수로 고쳐, 모르는 값을 버리고 선택지 순서로 맞추는 규칙을 함께 쓴다.
// 적용하지 않고 닫으면 임시 쿼리를 버린다. 다음에 열 때 주소의 값으로 다시 채운다.
// "초기화"는 시트 안의 장르와 판매 상태 선택만 지우고 시트를 닫지 않는다. 주소는 적용할 때 바뀐다.
// 적용은 칩 줄과 같이 router.replace로 방문 기록을 쌓지 않는다.
// 칩 이름과 필터 점은 서버가 새 목록을 그릴 때까지 기다리지 않도록 useOptimistic으로 적용한 쿼리를 먼저 보인다.
export function ShowFilterBar({ query }: { query: ShowListQuery }) {
  const router = useRouter();
  const [shownQuery, setShownQuery] = useOptimistic(query);
  const [draft, setDraft] = useState(query);
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<FilterSection>('top');
  const hasFilter = shownQuery.genre.length > 0 || shownQuery.status.length > 0;

  function openSheet(target: FilterSection) {
    setDraft(query);
    setSection(target);
    setOpen(true);
  }

  // 시트가 열려 부분이 그려질 때 그 부분이 본문 맨 위에 오도록 본문을 스크롤한다.
  // 시트는 닫히면 트리에서 빠지므로, 열 때마다 이 ref가 다시 불린다.
  const scrollToSection = useCallback((element: HTMLElement | null) => {
    const body = element?.closest<HTMLElement>(
      '[data-filter-sheet-body]',
    )?.parentElement;
    if (!element || !body) return;
    body.scrollTop +=
      element.getBoundingClientRect().top - body.getBoundingClientRect().top;
  }, []);

  return (
    <>
      <div className="flex items-center gap-sm">
        <div className="flex min-w-0 flex-1 gap-sm overflow-x-auto scrollbar-none">
          <FilterBarButton
            selected={shownQuery.genre.length > 0}
            onClick={() => {
              openSheet('genre');
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
              openSheet('status');
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
            openSheet('top');
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
        <ShowSortSheet query={query} />
      </div>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Popup>
          <Drawer.Header>
            <Drawer.Title>필터</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <div data-filter-sheet-body className="flex flex-col gap-lg">
              <div ref={section === 'genre' ? scrollToSection : undefined}>
                <ToggleGroup
                  label="장르"
                  items={GENRE_ITEMS}
                  value={draft.genre}
                  onValueChange={(value) => {
                    setDraft(getGenreChangeQuery({ query: draft, value }));
                  }}
                />
              </div>
              <div ref={section === 'status' ? scrollToSection : undefined}>
                <ToggleGroup
                  label="판매 상태"
                  items={STATUS_ITEMS}
                  value={draft.status}
                  onValueChange={(value) => {
                    setDraft(getStatusChangeQuery({ query: draft, value }));
                  }}
                />
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setDraft({ ...draft, genre: [], status: [] });
              }}
            >
              초기화
            </Button>
            <Drawer.Close
              variant="primary"
              onClick={() => {
                startTransition(() => {
                  setShownQuery(draft);
                  router.replace(getFilterApplyHref(draft));
                });
              }}
            >
              적용
            </Drawer.Close>
          </Drawer.Footer>
        </Drawer.Popup>
      </Drawer.Root>
    </>
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
