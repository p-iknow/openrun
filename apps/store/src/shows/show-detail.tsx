import { Badge, Skeleton } from '@openrun/store-ui';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { ShowDetailData } from './select-show-detail';

// 데스크톱(lg)은 2단이다. 왼쪽이 공연 정보, 오른쪽이 스크롤을 따라오는 회차 패널이다.
// 모바일은 한 단이라 패널이 공연 정보 아래로 간다. 화면 폭은 CSS로만 나눈다.
// 상세 화면과 로딩 화면이 같은 틀을 써서, 응답이 와도 자리가 흔들리지 않는다.
export function ShowDetailLayout({
  info,
  panel,
}: {
  info: ReactNode;
  panel: ReactNode;
}) {
  return (
    <main className="grid grid-cols-1 gap-2xl lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {info}
      {/* 머리글은 스크롤과 함께 올라가므로 화면 맨 위에서 본문 간격(xl)만큼 띄워 붙는다. */}
      <aside className="lg:sticky lg:top-xl">{panel}</aside>
    </main>
  );
}

// 포스터는 3:4로 크기가 정해져, 이미지가 늦게 와도 글자가 밀리지 않는다.
function ShowInfoFrame({
  poster,
  summary,
  description,
}: {
  poster: ReactNode;
  summary: ReactNode;
  description: ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-2xl">
      <div className="flex gap-lg sm:gap-xl">
        <div className="relative aspect-3/4 w-[120px] shrink-0 overflow-hidden rounded-card bg-surface-muted sm:w-[240px]">
          {poster}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-md">{summary}</div>
      </div>
      <section>
        <h2 className="mb-md text-title font-bold">공연 소개</h2>
        {description}
      </section>
    </article>
  );
}

// 모바일은 120px, sm부터 240px이다. ShowInfoFrame의 포스터 폭과 맞춘다.
const POSTER_SIZES = '(min-width: 640px) 240px, 120px';

export function ShowInfo({ show }: { show: ShowDetailData }) {
  const facts = [
    { term: '장르', value: show.genre },
    { term: '공연장', value: show.venueName },
    { term: '공연 기간', value: show.period },
    { term: '관람 연령', value: show.ageRating },
    { term: '러닝타임', value: show.runningTime },
  ];

  return (
    <ShowInfoFrame
      poster={
        // 제목이 바로 옆에 글자로 있어 포스터는 장식으로 둔다. 첫 화면에 보이는 큰 이미지라 먼저 불러온다.
        <Image
          src={show.posterUrl}
          alt=""
          fill
          sizes={POSTER_SIZES}
          preload
          className="object-cover"
        />
      }
      summary={
        <>
          <div className="flex items-center gap-sm">
            <Badge tone={show.salesStatus.tone}>{show.salesStatus.label}</Badge>
          </div>
          <h1 className="text-title font-bold break-keep sm:text-heading">
            {show.title}
          </h1>
          {show.salesOpenAt === null ? null : (
            <p className="text-body-sm font-semibold text-success-strong">
              {show.salesOpenAt}
            </p>
          )}
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-lg gap-y-xs text-body-sm">
            {facts.map(({ term, value }) => (
              <div key={term} className="col-span-2 grid grid-cols-subgrid">
                <dt className="text-text-secondary">{term}</dt>
                <dd className="break-keep">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      }
      description={
        // 소개 본문의 줄바꿈을 그대로 보여 준다.
        <p className="break-keep whitespace-pre-line">{show.description}</p>
      }
    />
  );
}

export function ShowInfoSkeleton() {
  return (
    <ShowInfoFrame
      poster={<Skeleton className="size-full rounded-none" />}
      summary={
        <>
          <Skeleton className="h-[24px] w-[56px] rounded-badge" />
          <Skeleton className="h-[32px] w-3/4 rounded-badge" />
          <div className="flex flex-col gap-xs">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-[20px] w-2/3 rounded-badge" />
            ))}
          </div>
        </>
      }
      description={
        <div className="flex flex-col gap-xs">
          <Skeleton className="h-[20px] w-full rounded-badge" />
          <Skeleton className="h-[20px] w-full rounded-badge" />
          <Skeleton className="h-[20px] w-1/2 rounded-badge" />
        </div>
      }
    />
  );
}

// 데스크톱에서 패널이 화면보다 길면 따라오는 동안 아래쪽 회차에 닿을 수 없다.
// 그래서 패널 높이를 화면 높이에서 위아래 여백(xl 두 번)을 뺀 만큼으로 막고, 회차 목록만 안에서 스크롤한다.
export function PerformancePanel({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-lg rounded-panel border border-border p-lg lg:max-h-[calc(100dvh-3rem)]">
      <h2 className="text-title font-bold">회차</h2>
      <div className="min-h-0 lg:overflow-y-auto">{children}</div>
    </section>
  );
}

// 달력(제목, 요일 줄, 6주)과 고른 날의 회차 두 줄 자리다.
export function PerformanceCalendarSkeleton() {
  return (
    <div className="flex flex-col gap-lg">
      <Skeleton className="mx-auto h-[32px] w-[120px] rounded-badge" />
      <Skeleton className="h-[240px] w-full rounded-card" />
      <div className="flex flex-col gap-sm border-t border-border pt-lg">
        <Skeleton className="h-[20px] w-[120px] rounded-badge" />
        <Skeleton className="h-[46px] w-full rounded-card" />
        <Skeleton className="h-[46px] w-full rounded-card" />
      </div>
    </div>
  );
}
