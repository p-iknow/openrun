'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FilterBarButton } from './filter-bar-button';
import { isWideScreen, PickerSheet } from './picker-sheet';
import {
  getSortChangeHref,
  SHOW_SORTS,
  type ShowListQuery,
  type ShowSort,
} from './show-list-query';

const SORT_LABELS: Record<ShowSort, string> = {
  start_date: '공연 시작일 순',
  newest: '최근 등록 순',
};

const SORT_ITEMS = SHOW_SORTS.map((sort) => ({
  value: sort,
  label: SORT_LABELS[sort],
}));

// 공연 목록의 정렬. NOL 티켓 모바일 검색 결과처럼 정렬 버튼으로 정렬 창(좁은 화면은 바텀 시트, 넓은 화면은 대화상자)을 열고, 선택지를 누르면 바로 적용하고 닫는다.
// 정렬은 한 번에 하나만 고르므로 필터 시트와 달리 적용 버튼이 없다. 필터 적용과 같이 router.replace로 바꿔 방문 기록을 쌓지 않는다.
export function ShowSortSheet({ query }: { query: ShowListQuery }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);

  return (
    <>
      <FilterBarButton
        onClick={() => {
          setWide(isWideScreen());
          setOpen(true);
        }}
      >
        <SortIcon />
        정렬
      </FilterBarButton>
      <PickerSheet wide={wide} open={open} onOpenChange={setOpen} title="정렬">
        <ul className="-mx-sm flex flex-col">
          {SORT_ITEMS.map((item) => {
            const current = item.value === query.sort;
            return (
              <li key={item.value}>
                <button
                  type="button"
                  aria-current={current || undefined}
                  onClick={() => {
                    setOpen(false);
                    router.replace(
                      getSortChangeHref({ query, sort: item.value }),
                    );
                  }}
                  className="flex h-[48px] w-full items-center justify-between rounded-card px-sm text-left text-body outline-primary hover:bg-surface-muted focus-visible:outline-2 aria-current:bg-surface-muted aria-current:font-bold"
                >
                  {item.label}
                  {current && <CheckIcon />}
                </button>
              </li>
            );
          })}
        </ul>
      </PickerSheet>
    </>
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

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[20px] shrink-0 text-primary-strong"
    >
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  );
}
