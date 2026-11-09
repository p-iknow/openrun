import { Skeleton } from '@openrun/store-ui';
import type { ReactNode } from 'react';
import type { ShowCardData } from './select-show-cards';

// 모바일은 가로형 행 목록, sm부터 포스터 카드 그리드(lg에서 4열)다. 화면 폭은 CSS로만 나눈다.
export function ShowCardList({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-lg sm:grid-cols-3 sm:gap-x-lg sm:gap-y-xl lg:grid-cols-4">
      {children}
    </ul>
  );
}

export function ShowCard({ show }: { show: ShowCardData }) {
  return (
    <li className="flex gap-md sm:flex-col sm:gap-sm">
      {/* 포스터는 뒤 티켓에서 넣는다. 그때도 같은 3:4 자리를 차지해 목록이 흔들리지 않는다. */}
      <Skeleton className="aspect-[3/4] w-[96px] shrink-0 sm:w-full" />
      <div className="flex min-w-0 flex-col gap-xs">
        <h2 className="line-clamp-2 text-body font-semibold break-keep">
          {show.title}
        </h2>
        <p className="truncate text-body-sm text-text-secondary">
          {show.venueName}
        </p>
        <p className="text-body-sm text-text-secondary">{show.period}</p>
      </div>
    </li>
  );
}

export function ShowCardSkeleton() {
  return (
    <li className="flex gap-md sm:flex-col sm:gap-sm">
      <Skeleton className="aspect-[3/4] w-[96px] shrink-0 sm:w-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-sm">
        <Skeleton className="h-[20px] w-full rounded-badge" />
        <Skeleton className="h-[16px] w-1/2 rounded-badge" />
        <Skeleton className="h-[16px] w-2/3 rounded-badge" />
      </div>
    </li>
  );
}
