'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import type { MouseEventHandler, ReactNode } from 'react';

// 클라이언트용 컴포넌트다. 지시어는 import보다 앞, 파일 첫 줄에 둔다.
// Server Component에서 쓸 때는 직렬화할 수 있는 props(문자열, 불리언, 요소)만 넘긴다. onClick은 클라이언트 컴포넌트에서만 넘긴다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.
const buttonVariants = cva(
  [
    'inline-flex h-[52px] items-center justify-center gap-sm rounded-button px-xl text-body font-semibold transition-colors select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    // Base UI가 비활성일 때 data-disabled를 붙인다. 종류와 관계없이 같은 회색으로 그린다.
    'data-disabled:cursor-not-allowed data-disabled:bg-surface-muted data-disabled:text-text-tertiary',
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
  /** 함수라서 Server Component에서는 넘길 수 없다. 앱의 클라이언트 컴포넌트에서 넘긴다. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

export function Button({
  variant,
  type = 'button',
  disabled,
  onClick,
  children,
}: ButtonProps) {
  return (
    <BaseButton
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={buttonVariants({ variant })}
    >
      {children}
    </BaseButton>
  );
}
