import { cn } from '@openrun/store-ui';
import type { ReactNode } from 'react';

// 필터 줄의 둥근 버튼. 장르·판매 상태 칩, 필터, 정렬 버튼이 같은 모양을 쓴다.
// 고른 값이 있는 칩은 시트 안의 고른 칩(store-ui ToggleGroup)과 같은 파란 테두리, 바탕, 굵은 글자로 보인다.
export function FilterBarButton({
  selected = false,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex h-[40px] shrink-0 items-center gap-xs rounded-full border px-md text-body-sm whitespace-nowrap select-none',
        'outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
        selected
          ? 'border-primary bg-primary-subtle font-bold text-primary-strong'
          : 'border-border-strong bg-surface text-text hover:bg-surface-muted',
      )}
    >
      {children}
    </button>
  );
}

/** 칩이 시트를 연다는 것을 보이는 아래 화살표. */
export function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[16px] shrink-0"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
