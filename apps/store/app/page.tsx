import { connection } from 'next/server';
import { createServerApiClient } from '../src/api-client';
import { fetchShows } from '../src/shows/fetch-shows';

export default async function HomePage() {
  // 이 페이지는 빌드 때 미리 그리지 않고 요청마다 렌더링한다. 그래서 빌드에 API와 DB가 필요 없다.
  await connection();
  const shows = await fetchShows(createServerApiClient());

  return (
    <main>
      <h1>공연</h1>
      <ul>
        {shows.map((show) => (
          <li key={show.id}>{show.title}</li>
        ))}
      </ul>
    </main>
  );
}
