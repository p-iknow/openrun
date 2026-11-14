import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { ApiError } from '@/api/api-error';
import { createServerApiClient } from '@/api/client';
import { fetchShowDetail } from '@/api/shows';
import { PerformanceCalendar } from './_detail/performance-calendar';
import { selectShowDetail } from './_detail/show-detail.helpers';
import {
  PerformancePanel,
  PerformanceSheet,
  ShowDetailLayout,
  ShowInfo,
} from './_detail/show-detail';

// generateMetadata와 페이지가 같은 요청 안에서 API를 한 번만 부르도록 React cache로 묶는다.
// 없는 공연이면 notFound()로 404 화면을 보여 준다.
const loadShowDetail = cache(async (id: string) => {
  // 이 페이지는 요청마다 렌더링한다. 판매 상태와 남은 좌석은 실시간이어야 한다.
  await connection();
  // API 경로에는 숫자로 바꾼 id가 들어간다. '01', '1e0'처럼 다른 글자가 같은 숫자로 바뀌는 주소는
  // 원래 글자 그대로는 없는 공연이므로 API에 묻지 않는다. 숫자가 아닌 글자(NaN)도 여기서 걸린다.
  const showId = Number(id);
  if (String(showId) !== id) {
    notFound();
  }
  try {
    return selectShowDetail(
      await fetchShowDetail({ client: createServerApiClient(), id: showId }),
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === 'SHOW_NOT_FOUND') {
      notFound();
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: PageProps<'/shows/[id]'>): Promise<Metadata> {
  const show = await loadShowDetail((await params).id);
  return { title: show.title };
}

export default async function ShowDetailPage({
  params,
}: PageProps<'/shows/[id]'>) {
  const show = await loadShowDetail((await params).id);

  // 데스크톱 패널과 모바일 시트에 같은 내용을 넣는다. 화면 폭에 따라 둘 중 하나만 보인다.
  const performances = show.isSalesEnded ? (
    <p className="py-xl text-center text-text-secondary">
      판매가 종료된 공연입니다
    </p>
  ) : (
    <PerformanceCalendar days={show.performanceDays} />
  );

  return (
    <ShowDetailLayout
      info={<ShowInfo show={show} />}
      panel={<PerformancePanel>{performances}</PerformancePanel>}
      bottomBar={
        <PerformanceSheet
          showTitle={show.title}
          isSalesEnded={show.isSalesEnded}
        >
          {performances}
        </PerformanceSheet>
      }
    />
  );
}
