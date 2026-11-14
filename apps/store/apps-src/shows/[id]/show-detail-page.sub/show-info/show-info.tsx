import { Badge, Skeleton } from '@openrun/store-ui';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { CollapsibleDetailImages } from './show-info.sub/collapsible-detail-images';
import type { ShowDetailData } from '../../show-detail-page.helper';

// NOL 티켓 상세처럼 맨 위에 흐리게 번진 포스터를 배경으로 깔고, 그 가운데에 포스터를 둔다. 제목과 공연 정보는 그 아래에 놓는다.
// 배경 상자와 포스터는 비율로 크기가 정해져, 이미지가 늦게 와도 글자가 밀리지 않는다.
// 포스터 칸은 배경 상자 높이의 85%이고 3:4라, 화면 폭이 좁아도 늘어나거나 잘리지 않는다.
function ShowInfoFrame({
  backdrop,
  poster,
  summary,
  description,
}: {
  backdrop: ReactNode;
  poster: ReactNode;
  summary: ReactNode;
  description: ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-2xl">
      <div className="flex flex-col gap-lg">
        <div className="relative flex aspect-6/5 items-center justify-center overflow-hidden rounded-panel bg-surface-muted sm:aspect-2/1">
          {backdrop}
          <div className="relative aspect-3/4 h-[85%] overflow-hidden rounded-card bg-surface-muted shadow-floating">
            {poster}
          </div>
        </div>
        <div className="flex flex-col gap-md">{summary}</div>
      </div>
      <section>
        <h2 className="mb-md text-title font-bold">공연 소개</h2>
        {description}
      </section>
    </article>
  );
}

// 포스터 칸의 폭. 모바일은 배경 상자(화면 폭 - 좌우 여백, 6:5) 높이의 85%에 3:4를 곱해 화면 폭의 약 50%,
// sm부터는 배경 상자(2:1)가 본문 폭을 따라 가장 넓을 때 약 780px이라 포스터 폭이 250px 남짓이다.
const POSTER_SIZES = '(min-width: 640px) 250px, 55vw';
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
      // 제목이 바로 아래 글자로 있어 포스터와 배경은 장식으로 둔다.
      // 배경도 같은 src와 sizes를 써서 브라우저가 고르는 이미지 주소가 같다. 한 번만 받아 두 곳에 쓴다.
      backdrop={
        <Image
          src={show.posterUrl}
          alt=""
          fill
          sizes={POSTER_SIZES}
          // 화면에서 가장 크게 보이는 그림(LCP)이라 늦게 불러오지 않는다. 포스터가 먼저 불러온 것과 같은 주소라 다시 받지 않는다.
          loading="eager"
          className="scale-125 object-cover opacity-70 blur-2xl"
        />
      }
      poster={
        // 첫 화면에 보이는 큰 이미지라 먼저 불러온다.
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
            {/* NOL 티켓처럼 공연 정보 목록에 등급별 가격을 둔다. 어느 자리가 어느 등급인지는 좌석 배치도에서 보여 준다. */}
            {show.seatGrades.length > 0 && (
              <div className="col-span-2 grid grid-cols-subgrid">
                <dt className="text-text-secondary">가격</dt>
                <dd>
                  <ul className="flex flex-col gap-xs">
                    {show.seatGrades.map((grade) => (
                      <li
                        key={grade.name}
                        className="flex flex-wrap gap-x-sm break-keep"
                      >
                        <span className="font-semibold">{grade.name}</span>
                        <span>{grade.price}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </>
      }
      description={
        show.detailImages.length === 0 ? (
          // 상세 이미지가 없으면 소개 본문을 그대로 보여 준다. 줄바꿈도 그대로 둔다.
          <p className="break-keep whitespace-pre-line">{show.description}</p>
        ) : (
          <>
            {/* NOL 티켓처럼 소개는 상세 이미지로 보여 준다. 이미지 속 글은 화면 낭독기가 읽지 못하므로,
                같은 내용을 글로 옮긴 소개 본문을 화면에는 보이지 않게 두고 이미지는 장식으로 둔다(WCAG 1.1.1). */}
            <p className="sr-only">{show.description}</p>
            {/* 이미지 사이를 띄우지 않아 여러 장이 한 장처럼 이어진다.
                NOL 티켓처럼 원본 크기를 받지 않아 일반 img로 원본을 그대로 그린다. 비율을 몰라 자리를 미리 잡지 못하지만,
                접힌 상자가 최대 높이에서 잘리므로 늦게 온 이미지가 아래 내용을 밀어내는 폭도 그 높이까지로 묶인다.
                첫 장은 첫 화면 끝에 걸려 가장 큰 그림(LCP)이 되기 쉬우므로 바로 불러오고, 나머지는 늦게 불러온다. */}
            <CollapsibleDetailImages>
              <div className="flex flex-col items-center">
                {show.detailImages.map((image, index) => (
                  // next/image는 원본 크기나 크기가 정해진 부모가 있어야 하는데, 상세 이미지는 둘 다 없다.
                  // oxlint-disable-next-line nextjs/no-img-element
                  <img
                    key={image.url}
                    src={image.url}
                    alt=""
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className="h-auto w-full max-w-[860px]"
                  />
                ))}
              </div>
            </CollapsibleDetailImages>
          </>
        )
      }
    />
  );
}

export function ShowInfoSkeleton() {
  return (
    <ShowInfoFrame
      backdrop={null}
      poster={<Skeleton className="size-full rounded-none" />}
      summary={
        <>
          <Skeleton className="h-[24px] w-[56px] rounded-badge" />
          <Skeleton className="h-[32px] w-3/4 rounded-badge" />
          <div className="flex flex-col gap-xs">
            {Array.from({ length: 6 }, (_, index) => (
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
