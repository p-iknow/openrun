import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

// 서버용 컴포넌트다. 훅, 상태, 브라우저 API를 쓰지 않는다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.
const badgeVariants = cva(
  'inline-flex h-[24px] items-center rounded-badge px-sm text-caption font-semibold',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-muted text-text-secondary',
        primary: 'bg-primary-subtle text-primary-strong',
        success: 'bg-success-subtle text-success-strong',
        warning: 'bg-warning-subtle text-text',
        danger: 'bg-danger-subtle text-danger-strong',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone, children }: BadgeProps) {
  return <span className={badgeVariants({ tone })}>{children}</span>;
}
