import { Badge, Button } from '@openrun/store-ui';
import { connection } from 'next/server';
import { createServerApiClient } from '../src/api-client';
import { fetchShows } from '../src/shows/fetch-shows';

export default async function HomePage() {
  // 이 페이지는 빌드 때 미리 그리지 않고 요청마다 렌더링한다. 그래서 빌드에 API와 DB가 필요 없다.
  await connection();
  const shows = await fetchShows(createServerApiClient());

  return (
    <main>
      {/* 서버용(Badge)과 클라이언트용(Button) 컴포넌트를 Server Component에서 직접 렌더링한다. */}
      <section className="mb-2xl flex flex-col gap-md rounded-panel border border-border p-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-start gap-sm">
          <Badge tone="primary">테스트 서비스</Badge>
          <p className="text-body-sm break-keep text-text-secondary">
            포트폴리오용으로 만든 가상 공연 예매 서비스입니다.
          </p>
        </div>
        {/* 함수 prop 없이 브라우저 기본 동작(GET 폼 제출)으로 목록을 다시 불러온다. */}
        <form action="/">
          <Button type="submit" variant="secondary">
            새로고침
          </Button>
        </form>
      </section>
      <h1 className="text-heading font-bold">공연</h1>
      <ul className="mt-lg divide-y divide-border rounded-card bg-surface-muted px-lg">
        {shows.map((show) => (
          <li key={show.id} className="py-md">
            {show.title}
          </li>
        ))}
      </ul>
    </main>
  );
}
