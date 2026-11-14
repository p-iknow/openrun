'use client';

import { type PickerController, PickerSheet } from './picker-sheet';
import type { ShowSort } from '@shared/feature/show/helper/show-list-query';
import { SORT_ITEMS } from '../show-filter-bar.helper/sort-items';

// 정렬 창의 내용. ShowFilterBar가 overlay-kit의 `overlay.openAsync`로 열고, 이 창은 고른 정렬을 `controller.close`로 돌려준다.
// NOL 티켓 모바일 검색 결과의 정렬 시트처럼 선택지를 누르면 바로 닫힌다. 정렬은 하나만 고르므로 필터 창과 달리 적용 버튼이 없다.
// 고르지 않고 닫으면 `null`을 돌려준다. 주소를 바꾸는 일은 여는 쪽이 한다.
export function ShowSortSheet({
  controller,
  currentSort,
}: {
  controller: PickerController<ShowSort>;
  /** 지금 주소의 정렬. 체크 표시를 단다. */
  currentSort: ShowSort;
}) {
  return (
    <PickerSheet controller={controller} title="정렬">
      <ul className="-mx-sm flex flex-col">
        {SORT_ITEMS.map((item) => {
          const current = item.value === currentSort;
          return (
            <li key={item.value}>
              <button
                type="button"
                aria-current={current || undefined}
                onClick={() => {
                  controller.close(item.value);
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
