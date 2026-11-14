import { Badge, Skeleton } from '@openrun/store-ui';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ShowCardData } from '../index-page.helper';

// 모바일은 가로형 행 목록, sm부터 포스터 카드 그리드(lg에서 4열)다. 화면 폭은 CSS로만 나눈다.
export function ShowCardList({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-lg sm:grid-cols-3 sm:gap-x-lg sm:gap-y-xl lg:grid-cols-4">
      {children}
    </ul>
  );
}

// 카드와 로딩 카드가 같은 틀을 써서, 응답이 와서 바뀌어도 자리가 흔들리지 않는다.
// 포스터 자리는 이미지와 상관없이 3:4로 크기가 정해져, 이미지가 늦게 와도 목록이 밀리지 않는다.
// 모바일 행에서 글이 포스터보다 길어지면 flex 행이 포스터 칸을 글 높이만큼 늘려 이미지가 잘리므로, self-start로 3:4를 지킨다.
function ShowCardFrame({
  poster,
  children,
}: {
  poster: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="relative flex gap-md sm:flex-col sm:gap-sm">
      <div className="relative aspect-3/4 w-[96px] shrink-0 self-start overflow-hidden rounded-card bg-surface-muted sm:w-full">
        {poster}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-xs">{children}</div>
    </li>
  );
}

// 모바일은 96px, sm부터 3열, lg부터 4열(본문 최대 폭 1200px 기준 약 280px)이다. ShowCardList의 열 수와 맞춘다.
const POSTER_SIZES = '(min-width: 1024px) 280px, (min-width: 640px) 33vw, 96px';

export function ShowCard({ card }: { card: ShowCardData }) {
  return (
    <ShowCardFrame
      poster={
        // 제목이 바로 옆에 글자로 있어 포스터는 장식으로 둔다. 스크린 리더가 제목을 두 번 읽지 않는다.
        // 로드 전에는 틀의 배경색이 자리 표시자 역할을 한다.
        <Image
          src={card.posterUrl}
          alt=""
          fill
          sizes={POSTER_SIZES}
          className="object-cover"
        />
      }
    >
      <div className="flex items-center gap-sm">
        <Badge tone={card.salesStatus.tone}>{card.salesStatus.label}</Badge>
      </div>
      <h2 className="line-clamp-2 text-body font-semibold break-keep">
        {/* 링크는 제목에만 걸고, 가상 요소를 카드(li) 전체에 펼쳐 카드 어디를 눌러도 상세로 간다.
            카드 전체를 링크로 감싸면 스크린 리더가 카드의 모든 글자를 링크 이름으로 읽는다. */}
        <Link
          href={`/shows/${card.id}`}
          className="after:absolute after:inset-0 after:rounded-card hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
        >
          {card.title}
        </Link>
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
    <ShowCardFrame poster={<Skeleton className="size-full rounded-none" />}>
      <Skeleton className="h-[24px] w-[56px] rounded-badge" />
      <Skeleton className="h-[20px] w-full rounded-badge" />
      <Skeleton className="h-[16px] w-1/2 rounded-badge" />
      <Skeleton className="h-[16px] w-2/3 rounded-badge" />
    </ShowCardFrame>
  );
}
