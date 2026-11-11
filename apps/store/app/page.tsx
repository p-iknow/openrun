import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createServerApiClient } from '../src/api-client';
import { fetchShows } from '../src/shows/fetch-shows';
import { selectShowCards } from '../src/shows/select-show-cards';
import { ShowCard, ShowCardList } from '../src/shows/show-card';
import { ShowListPagination } from '../src/shows/show-list-pagination';
import {
  normalizeShowListQuery,
  selectPastLastPageRedirect,
} from '../src/shows/show-list-query';

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  // 이 페이지는 빌드 때 미리 그리지 않고 요청마다 렌더링한다. 그래서 빌드에 API와 DB가 필요 없다.
  await connection();
  // 잘못 고친 주소는 오류 화면 대신 정리된 주소로 보낸다. API를 부르기 전에 정리해 400 응답을 받지 않는다.
  const { query, redirectTo } = normalizeShowListQuery(await searchParams);
  if (redirectTo !== null) {
    redirect(redirectTo);
  }

  const page = await fetchShows({ client: createServerApiClient(), query });
  const lastPageHref = selectPastLastPageRedirect({ query, page });
  if (lastPageHref !== null) {
    redirect(lastPageHref);
  }
  const cards = selectShowCards(page);

  return (
    <main>
      <h1 className="mb-lg text-heading font-bold">공연</h1>
      <p className="mb-md text-body-sm text-text-secondary">
        공연 {page.totalCount}개
      </p>
      {cards.length === 0 ? (
        <p className="py-2xl text-center text-text-secondary">
          공연이 없습니다.
        </p>
      ) : (
        <>
          <ShowCardList>
            {cards.map((card) => (
              <ShowCard key={card.id} card={card} />
            ))}
          </ShowCardList>
          <div className="mt-2xl">
            <ShowListPagination query={query} totalPages={page.totalPages} />
          </div>
        </>
      )}
    </main>
  );
}
