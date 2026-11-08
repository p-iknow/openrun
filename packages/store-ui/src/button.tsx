'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import type { MouseEventHandler, ReactNode } from 'react';

// 클라이언트용 컴포넌트다. 지시어는 import보다 앞, 파일 첫 줄에 둔다.
// Server Component에서 쓸 때는 직렬화할 수 있는 props(문자열, 불리언, 요소)만 넘긴다. onClick은 클라이언트 컴포넌트에서만 넘긴다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.
const buttonVariants = cva(
  [
    'group relative inline-flex h-[52px] items-center justify-center rounded-button px-xl text-body font-semibold transition-colors select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    // Base UI가 비활성일 때 data-disabled를 붙인다. 종류와 관계없이 같은 회색으로 그린다.
    // 로딩 중에도 data-disabled가 붙지만, 그때는 종류의 색을 유지하고 커서만 바꾼다.
    'data-disabled:not-data-loading:cursor-not-allowed data-disabled:not-data-loading:bg-surface-muted data-disabled:not-data-loading:text-text-tertiary',
    'data-loading:cursor-wait',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-surface hover:not-data-disabled:bg-primary-hover',
        secondary:
          'bg-surface-muted text-text hover:not-data-disabled:bg-border',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>['variant']
>;

export interface ButtonProps {
  /** 주요 행동은 `primary`, 보조 행동은 `secondary`. */
  variant?: ButtonVariant;
  /** 폼 안에서 쓸 때 정한다. 기본은 `button`이라 폼을 제출하지 않는다. */
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  /**
   * 요청을 기다리는 중임을 보여 준다. 라벨 자리에 스피너를 겹쳐 폭을 유지하고, 누를 수 없지만 포커스는 잃지 않는다.
   * `disabled`와 함께 주면 `disabled`가 우선한다.
   */
  loading?: boolean;
  /** 함수라서 Server Component에서는 넘길 수 없다. 앱의 클라이언트 컴포넌트에서 넘긴다. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

export function Button({
  variant,
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  children,
}: ButtonProps) {
  const isLoading = loading && !disabled;
  return (
    <BaseButton
      type={type}
      disabled={disabled || isLoading}
      // 로딩이 끝날 때 포커스가 사라지지 않도록, 로딩 중에는 native disabled 대신 aria-disabled를 쓴다.
      focusableWhenDisabled={isLoading}
      aria-busy={isLoading || undefined}
      data-loading={isLoading || undefined}
      onClick={onClick}
      className={buttonVariants({ variant })}
    >
      {/* 라벨은 투명하게만 만들어 폭과 접근 가능한 이름을 그대로 둔다. */}
      <span className="inline-flex items-center gap-sm group-data-loading:opacity-0">
        {children}
      </span>
      {isLoading && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="size-[20px] rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" />
        </span>
      )}
    </BaseButton>
  );
}
