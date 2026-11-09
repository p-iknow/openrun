import { cn } from './cn.js';

// 서버용 컴포넌트다. 훅, 상태, 브라우저 API를 쓰지 않는다.
// 장식용이라 스크린 리더에서 숨긴다. 로딩 중임을 알리는 일은 감싸는 영역(aria-busy 등)이 맡는다.

export interface SkeletonProps {
  /** 크기와 비율을 정하고, 기본 모서리(`rounded-card`)를 덮을 수 있다. 예: 3:4 포스터는 `aspect-3/4 w-full`. */
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block rounded-card bg-surface-muted motion-safe:animate-pulse',
        className,
      )}
    />
  );
}
