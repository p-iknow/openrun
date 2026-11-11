'use client';

import { Select as BaseSelect } from '@base-ui/react/select';
import { cn } from './cn.js';

// 클라이언트용 컴포넌트다. 지시어와 props 규칙은 Button과 같다.
// Server Component에서 쓸 때는 직렬화할 수 있는 props(items 배열 포함)만 넘기고, onValueChange는 클라이언트 컴포넌트에서만 넘긴다.
// 키보드 조작과 포커스 이동은 Base UI Select가 맡는다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.

export interface SelectItem {
  /** 폼으로 제출되고 `onValueChange`로 받는 값. 예: `latest`. */
  value: string;
  /** 목록과 트리거에 보이는 이름. 예: `최신순`. */
  label: string;
}

export type SelectVariant = 'field' | 'inline';

export interface SelectProps {
  /** 트리거 버튼의 접근 가능한 이름. `field`이면 트리거 위에 늘 보이고, `inline`이면 화면에서 숨긴다. */
  label: string;
  /**
   * `field`는 폼 안의 입력 칸 모양(라벨, 테두리, 높이 52px)이다.
   * `inline`은 목록 위 줄에 놓는 작은 글자 드롭다운이다. 고른 값이 무엇을 정하는지 드러날 때(예: 정렬 `최근 등록 순`) 쓴다.
   */
  variant?: SelectVariant;
  items: SelectItem[];
  /** 폼으로 제출할 때 쓰는 이름. 고른 값이 숨은 입력에 담긴다. 예: 정렬이면 `sort`. */
  name?: string;
  /** 고른 값이 없을 때 트리거에 보이는 글자. */
  placeholder?: string;
  /** 처음 값. 비제어로만 쓰고, 바뀐 값은 `onValueChange`로 받는다. 주소의 정렬 기준을 채울 때 쓴다. */
  defaultValue?: string;
  /** 함수라서 Server Component에서는 넘길 수 없다. 앱의 클라이언트 컴포넌트에서 넘긴다. */
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function Select({
  label,
  variant = 'field',
  items,
  name,
  placeholder,
  defaultValue,
  onValueChange,
  disabled = false,
}: SelectProps) {
  return (
    <BaseSelect.Root
      // items를 넘기면 목록을 열기 전(서버 렌더링 포함)에도 트리거에 고른 항목의 이름을 보인다.
      items={items}
      name={name}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => {
        // 항목에 null이 없으므로 고른 값은 늘 문자열이다.
        if (nextValue !== null) onValueChange?.(nextValue);
      }}
      disabled={disabled}
    >
      <div className={cn(variant === 'field' && 'flex flex-col gap-sm')}>
        <BaseSelect.Label
          className={cn(
            variant === 'field'
              ? 'text-body-sm font-semibold text-text-secondary data-disabled:text-text-tertiary'
              : 'sr-only',
          )}
        >
          {label}
        </BaseSelect.Label>
        <BaseSelect.Trigger
          className={cn(
            'flex items-center gap-sm text-left text-text transition-colors select-none',
            // outline 색은 평소에 정해 둔다. 포커스 때 정하면 transition-colors가 글자색(검정)에서 파랑으로 넘어가며 깜빡인다.
            'outline-primary',
            // 흰 바탕에서도 text-tertiary는 대비가 약 3:1이라, 4.5:1을 넘는 text-secondary를 쓴다.
            'data-placeholder:text-text-secondary',
            'data-disabled:cursor-not-allowed data-disabled:text-text-tertiary',
            variant === 'field'
              ? [
                  'h-[52px] w-full justify-between rounded-button border border-border-input bg-surface px-lg text-body',
                  'hover:not-data-disabled:not-data-popup-open:border-border-input-hover',
                  'focus-visible:border-primary focus-visible:outline-1 focus-visible:-outline-offset-2',
                  'data-popup-open:border-primary data-popup-open:outline-1 data-popup-open:-outline-offset-2',
                  'data-disabled:border-border data-disabled:bg-surface-muted',
                ]
              : [
                  // 글자만 보이는 드롭다운이다. 누를 자리는 높이 40px로 넉넉히 두고, 가리키면 옅은 바탕으로 누를 수 있음을 알린다.
                  'h-[40px] gap-xs rounded-badge px-sm text-body-sm font-semibold',
                  'hover:not-data-disabled:bg-surface-muted data-popup-open:bg-surface-muted',
                  'focus-visible:outline-2 focus-visible:outline-offset-0',
                ],
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
              // inline은 글자가 작아 화살표도 글자 크기에 맞춘다.
              className={variant === 'field' ? 'size-[20px]' : 'size-[16px]'}
            >
              <path d="M5 7.5l5 5 5-5" />
            </svg>
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
      </div>
      <BaseSelect.Portal>
        {/* Base UI 기본값은 고른 항목을 트리거 위에 겹쳐 연다. 드롭다운처럼 트리거 아래에 열도록 끈다. */}
        <BaseSelect.Positioner
          alignItemWithTrigger={false}
          sideOffset={4}
          // inline은 보통 줄의 오른쪽 끝에 놓이므로 목록의 오른쪽 끝을 트리거에 맞춰 화면 밖으로 나가지 않게 한다.
          align={variant === 'field' ? 'start' : 'end'}
          className="z-10 outline-none"
        >
          <BaseSelect.Popup className="max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto rounded-card bg-surface p-xs shadow-floating outline-none">
            <BaseSelect.List>
              {items.map((item) => (
                <BaseSelect.Item
                  key={item.value}
                  value={item.value}
                  className={cn(
                    'flex cursor-default items-center justify-between gap-lg rounded-badge px-md py-sm text-body text-text outline-none select-none',
                    // 고른 항목은 가리켜도 파랑을 유지한다. 색만으로 구분하지 않도록 체크 표시도 둔다.
                    'data-selected:bg-primary-subtle',
                    'data-highlighted:not-data-selected:bg-surface-muted',
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
