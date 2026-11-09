import { connection } from 'next/server';
import { createServerApiClient } from '../src/api-client';
import { fetchShows } from '../src/shows/fetch-shows';
import { selectShowCards } from '../src/shows/select-show-cards';
import { ShowCard, ShowCardList } from '../src/shows/show-card';

export default async function HomePage() {
  // 이 페이지는 빌드 때 미리 그리지 않고 요청마다 렌더링한다. 그래서 빌드에 API와 DB가 필요 없다.
  await connection();
  const shows = selectShowCards(await fetchShows(createServerApiClient()));

  return (
    <main>
      <h1 className="mb-lg text-heading font-bold">공연</h1>
      {shows.length === 0 ? (
        <p className="py-2xl text-center text-text-secondary">
          공연이 없습니다.
        </p>
      ) : (
        <ShowCardList>
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </ShowCardList>
      )}
    </main>
  );
}
