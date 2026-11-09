'use client';

import { Select as BaseSelect } from '@base-ui/react/select';
import { cn } from './cn.js';

// 클라이언트용 컴포넌트다. 지시어와 props 규칙은 Button과 같다.
// Server Component에서 쓸 때는 직렬화할 수 있는 props(items 배열 포함)만 넘기고, onValueChange는 클라이언트 컴포넌트에서만 넘긴다.
// 키보드(Enter, Space, 화살표로 열기, 화살표와 글자로 이동, Enter로 고르기, Esc로 닫기)와 포커스 이동은 Base UI Select가 맡는다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.

export interface SelectItem {
  /** 폼으로 제출되고 `onValueChange`로 받는 값. 예: `latest`. */
  value: string;
  /** 목록과 트리거에 보이는 이름. 예: `최신순`. */
  label: string;
}

export interface SelectProps {
  /** 늘 보이는 라벨. 트리거 버튼의 접근 가능한 이름이 된다. */
  label: string;
  items: SelectItem[];
  /** 폼으로 제출할 때 쓰는 이름. 고른 값이 숨은 입력에 담긴다. 예: 정렬이면 `sort`. */
  name?: string;
  /** 고른 값이 없을 때 트리거에 보이는 글자. */
  placeholder?: string;
  /** 비제어로 쓸 때 처음 값. 주소의 정렬 기준을 채울 때 쓴다. */
  defaultValue?: string;
  /** 제어로 쓸 때 현재 값. `onValueChange`와 함께 넘긴다. */
  value?: string;
  /** 함수라서 Server Component에서는 넘길 수 없다. 앱의 클라이언트 컴포넌트에서 넘긴다. */
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function Select({
  label,
  items,
  name,
  placeholder,
  defaultValue,
  value,
  onValueChange,
  disabled = false,
}: SelectProps) {
  return (
    <BaseSelect.Root
      // items를 넘기면 목록을 열기 전(서버 렌더링 포함)에도 트리거에 고른 항목의 이름을 보인다.
      items={items}
      name={name}
      defaultValue={defaultValue}
      value={value}
      onValueChange={(nextValue) => {
        // 항목에 null이 없으므로 고른 값은 늘 문자열이다.
        if (nextValue !== null) onValueChange?.(nextValue);
      }}
      disabled={disabled}
    >
      <div className="flex flex-col gap-sm">
        <BaseSelect.Label className="text-body-sm font-semibold text-text-secondary data-disabled:text-text-tertiary">
          {label}
        </BaseSelect.Label>
        <BaseSelect.Trigger
          className={cn(
            // 방향 A: TextField와 같은 회색 면, 높이, 모서리를 쓴다.
            'flex h-[52px] w-full items-center justify-between gap-sm rounded-button bg-surface-muted px-lg text-left text-body text-text transition-colors select-none',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
            'hover:not-data-disabled:bg-border data-popup-open:bg-border',
            // 회색 면 위에서 대비 4.5:1을 넘는 글자 토큰은 text-secondary뿐이라 placeholder도 이 색을 쓴다.
            'data-placeholder:text-text-secondary',
            'data-disabled:cursor-not-allowed data-disabled:text-text-tertiary',
          )}
        >
          <BaseSelect.Value placeholder={placeholder} className="truncate" />
          <BaseSelect.Icon className="flex shrink-0 text-text-secondary transition-transform in-data-popup-open:rotate-180 in-data-disabled:text-text-tertiary">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[20px]"
            >
              <path d="M5 7.5l5 5 5-5" />
            </svg>
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
      </div>
      <BaseSelect.Portal>
        {/* 고른 항목을 트리거 위에 겹치지 않고, 드롭다운처럼 트리거 아래에 연다. */}
        <BaseSelect.Positioner
          alignItemWithTrigger={false}
          sideOffset={8}
          className="z-10 outline-none"
        >
          <BaseSelect.Popup className="max-h-[var(--available-height)] min-w-[var(--anchor-width)] overflow-y-auto rounded-card bg-surface p-xs shadow-floating outline-none">
            <BaseSelect.List>
              {items.map((item) => (
                <BaseSelect.Item
                  key={item.value}
                  value={item.value}
                  className={cn(
                    'flex cursor-default items-center justify-between gap-lg rounded-badge px-md py-sm text-body text-text outline-none select-none',
                    // 키보드와 마우스 모두 data-highlighted로 지금 가리키는 항목을 보인다.
                    'data-highlighted:bg-surface-muted',
                    'data-selected:font-semibold data-selected:text-primary-strong',
                  )}
                >
                  <BaseSelect.ItemText>{item.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="flex text-primary-strong">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-[20px]"
                    >
                      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                    </svg>
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
