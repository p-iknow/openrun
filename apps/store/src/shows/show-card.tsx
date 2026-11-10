import { Badge, Skeleton } from '@openrun/store-ui';
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

// 카드와 로딩 카드가 같은 틀을 써서, 응답이 와서 바뀌어도 자리가 흔들리지 않는다.
function ShowCardFrame({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-md sm:flex-col sm:gap-sm">
      {/* 포스터는 뒤 티켓에서 넣는다. 그때도 같은 3:4 자리를 차지한다. */}
      <Skeleton className="aspect-3/4 w-[96px] shrink-0 sm:w-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-xs">{children}</div>
    </li>
  );
}

export function ShowCard({ card }: { card: ShowCardData }) {
  return (
    <ShowCardFrame>
      <div className="flex items-center gap-sm">
        <Badge tone={card.salesStatus.tone}>{card.salesStatus.label}</Badge>
      </div>
      <h2 className="line-clamp-2 text-body font-semibold break-keep">
        {card.title}
      </h2>
      <p className="truncate text-body-sm text-text-secondary">
        {card.venueName}
      </p>
      <p className="text-body-sm text-text-secondary">{card.period}</p>
      {card.salesOpenAt === null ? null : (
        <p className="text-body-sm font-semibold text-success-strong">
          {card.salesOpenAt}
        </p>
      )}
    </ShowCardFrame>
  );
}

export function ShowCardSkeleton() {
  return (
    <ShowCardFrame>
      <Skeleton className="h-[24px] w-[56px] rounded-badge" />
      <Skeleton className="h-[20px] w-full rounded-badge" />
      <Skeleton className="h-[16px] w-1/2 rounded-badge" />
      <Skeleton className="h-[16px] w-2/3 rounded-badge" />
    </ShowCardFrame>
  );
}
