import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { createServerApiClient } from '../../../src/api-client';
import { fetchShowDetail } from '../../../src/shows/fetch-show-detail';
import { selectShowDetail } from '../../../src/shows/select-show-detail';
import {
  PerformanceDayList,
  PerformancePanel,
  ShowDetailLayout,
  ShowInfo,
} from '../../../src/shows/show-detail';

// generateMetadata와 페이지가 같은 요청 안에서 API를 한 번만 부르도록 React cache로 묶는다.
const getShowDetail = cache(async (id: string) => {
  // 이 페이지는 요청마다 렌더링한다. 판매 상태와 남은 좌석은 실시간이어야 한다.
  await connection();
  // 숫자가 아닌 id는 NaN이 되어 API가 없는 공연(404)으로 응답한다. 어떤 id가 있는 공연인지는 API가 정한다.
  return selectShowDetail(
    await fetchShowDetail({ client: createServerApiClient(), id: Number(id) }),
  );
});

export async function generateMetadata({
  params,
}: PageProps<'/shows/[id]'>): Promise<Metadata> {
  const show = await getShowDetail((await params).id);
  if (show === null) {
    notFound();
  }
  return { title: show.title };
}

export default async function ShowDetailPage({
  params,
}: PageProps<'/shows/[id]'>) {
  const show = await getShowDetail((await params).id);
  if (show === null) {
    notFound();
  }

  return (
    <ShowDetailLayout
      info={<ShowInfo show={show} />}
      panel={
        <PerformancePanel>
          {show.isSalesEnded ? (
            <p className="py-xl text-center text-text-secondary">
              판매가 종료된 공연입니다
            </p>
          ) : (
            <PerformanceDayList days={show.performanceDays} />
          )}
        </PerformancePanel>
      }
    />
  );
}
