'use client';

import { PickerSheet } from './picker-sheet';
import { SHOW_SORTS, type ShowSort } from './show-list-query';

const SORT_LABELS: Record<ShowSort, string> = {
  start_date: '공연 시작일 순',
  newest: '최근 등록 순',
};

const SORT_ITEMS = SHOW_SORTS.map((sort) => ({
  value: sort,
  label: SORT_LABELS[sort],
}));

// 정렬 창의 내용. ShowFilterBar가 overlay-kit의 `overlay.openAsync`로 열고, 이 창은 고른 정렬을 `close`로 돌려준다.
// NOL 티켓 모바일 검색 결과의 정렬 시트처럼 선택지를 누르면 바로 닫힌다. 정렬은 하나만 고르므로 필터 창과 달리 적용 버튼이 없다.
// 고르지 않고 닫으면 `null`을 돌려준다. 주소를 바꾸는 일은 여는 쪽이 한다.
export function ShowSortSheet({
  wide,
  currentSort,
  isOpen,
  close,
  unmount,
}: {
  /** overlay-kit의 `isOpen` */
  isOpen: boolean;
  /** overlay-kit의 `close`. 고른 정렬, 고르지 않고 닫으면 `null`을 넘긴다. */
  close: (result: ShowSort | null) => void;
  /** overlay-kit의 `unmount`. 닫히는 애니메이션이 끝난 뒤 부른다. */
  unmount: () => void;
  /** 대화상자로 열지. 여는 버튼에서 `isWideScreen()`으로 정한다. */
  wide: boolean;
  /** 지금 주소의 정렬. 체크 표시를 단다. */
  currentSort: ShowSort;
}) {
  return (
    <PickerSheet
      wide={wide}
      open={isOpen}
      onOpenChange={() => {
        close(null);
      }}
      onCloseComplete={unmount}
      title="정렬"
    >
      <ul className="-mx-sm flex flex-col">
        {SORT_ITEMS.map((item) => {
          const current = item.value === currentSort;
          return (
            <li key={item.value}>
              <button
                type="button"
                aria-current={current || undefined}
                onClick={() => {
                  close(item.value);
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
