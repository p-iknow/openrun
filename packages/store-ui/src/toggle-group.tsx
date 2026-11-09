'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { useId } from 'react';
import { cn } from './cn.js';

// 클라이언트용 컴포넌트다. 지시어와 props 규칙은 Button과 같다.
// Server Component에서 쓸 때는 직렬화할 수 있는 props(items 배열 포함)만 넘기고, onValueChange는 클라이언트 컴포넌트에서만 넘긴다.
// 칩마다 aria-pressed를 붙이고 화살표 키로 칩 사이를 옮기는 일은 Base UI ToggleGroup이 맡는다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.

export interface ToggleGroupItem {
  /** `onValueChange`로 받는 값. 예: `new`. */
  value: string;
  /** 칩에 보이는 이름. 예: `새 항목`. */
  label: string;
  /** 이 칩만 누를 수 없게 한다. */
  disabled?: boolean;
}

export interface ToggleGroupProps {
  /** 늘 보이는 라벨. 칩 묶음의 접근 가능한 이름이 된다. */
  label: string;
  items: ToggleGroupItem[];
  /** 처음 고른 값들. 비제어로만 쓰고, 바뀐 값은 `onValueChange`로 받는다. 주소의 필터를 채울 때 쓴다. */
  defaultValue?: string[];
  /** 칩을 누를 때마다 고른 값 전체를 배열로 받는다. 함수라서 Server Component에서는 넘길 수 없다. */
  onValueChange?: (value: string[]) => void;
  /** 칩을 모두 누를 수 없게 한다. */
  disabled?: boolean;
}

export function ToggleGroup({
  label,
  items,
  defaultValue,
  onValueChange,
  disabled = false,
}: ToggleGroupProps) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-sm">
      <span
        id={labelId}
        className={cn(
          'text-body-sm font-semibold text-text-secondary',
          disabled && 'text-text-tertiary',
        )}
      >
        {label}
      </span>
      <BaseToggleGroup
        multiple
        aria-labelledby={labelId}
        defaultValue={defaultValue}
        // Base UI가 두 번째 인자로 주는 eventDetails는 공개 API에 드러내지 않는다.
        onValueChange={(nextValue) => onValueChange?.(nextValue)}
        disabled={disabled}
        // 좁은 화면에서는 칩이 다음 줄로 넘어간다.
        className="flex flex-wrap gap-sm"
      >
        {items.map((item) => (
          <Toggle
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              // 고르기 전후로 칩 크기가 그대로이도록 테두리는 두 상태 모두 1px로 두고 색만 바꾼다.
              // transition은 두지 않는다. 색과 굵기가 함께 즉시 바뀌어야 누른 결과가 바로 보인다.
              'inline-flex h-[40px] items-center rounded-full border border-border-strong bg-surface px-lg text-body-sm text-text select-none',
              'outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
              'hover:not-data-disabled:not-data-pressed:bg-surface-muted',
              // 색만으로 구분하지 않도록 고른 칩은 테두리와 글자 굵기도 바꾼다.
              // primary(blue500)는 primary-subtle 위에서 대비가 약 3.3:1이라, 글자는 작은 글자용 primary-strong을 쓴다.
              'data-pressed:border-primary data-pressed:bg-primary-subtle data-pressed:font-bold data-pressed:not-data-disabled:text-primary-strong',
              // 고른 칩이 비활성이어도 테두리와 바탕은 파랑을 유지해, 고른 상태였음을 알 수 있게 한다.
              'data-disabled:cursor-not-allowed data-disabled:text-text-tertiary data-disabled:not-data-pressed:bg-surface-muted',
            )}
          >
            {/*
              고르면 글자가 굵어지며 폭이 달라져, 칩 크기가 바뀌고 옆 칩이 밀린다.
              같은 칸에 보통 글자와 굵은 글자를 보이지 않게 겹쳐 두어, 칩 폭을 늘 둘 중 넓은 쪽으로 잡는다.
              한글은 굵은 글자가 더 좁을 때도 있어 둘 다 둔다.
            */}
            <span className="grid">
              <span
                aria-hidden="true"
                className="invisible col-start-1 row-start-1 font-normal"
              >
                {item.label}
              </span>
              <span
                aria-hidden="true"
                className="invisible col-start-1 row-start-1 font-bold"
              >
                {item.label}
              </span>
              <span className="col-start-1 row-start-1 text-center">
                {item.label}
              </span>
            </span>
          </Toggle>
        ))}
      </BaseToggleGroup>
    </div>
  );
}
