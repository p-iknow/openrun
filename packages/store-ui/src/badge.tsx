import type { ReactNode } from 'react';

export type BadgeTone =
  'neutral' | 'primary' | 'success' | 'warning' | 'danger';

// 서버용 컴포넌트다. 훅, 상태, 브라우저 API를 쓰지 않는다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.
const toneClassName: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-secondary',
  primary: 'bg-primary-subtle text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-badge px-sm py-xs text-caption font-semibold ${toneClassName[tone]}`}
    >
      {children}
    </span>
  );
}
