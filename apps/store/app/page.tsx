import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createServerApiClient } from '../src/api-client';
import { fetchShows } from '../src/shows/fetch-shows';
import { selectShowCards } from '../src/shows/select-show-cards';
import { ShowCard, ShowCardList } from '../src/shows/show-card';
import { ShowListPagination } from '../src/shows/show-list-pagination';
import {
  getLastPageRedirectHref,
  getShowListHref,
  normalizeShowListQuery,
} from '../src/shows/show-list-query';
import { ShowListSearchForm } from '../src/shows/show-list-search-form';
import { ShowSortSelect } from '../src/shows/show-sort-select';

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  // 이 페이지는 빌드 때 미리 그리지 않고 요청마다 렌더링한다. 그래서 빌드에 API와 DB가 필요 없다.
  await connection();
  // 잘못 고친 주소는 오류 화면 대신 정리된 주소로 보낸다. API를 부르기 전에 정리해 400 응답을 받지 않는다.
  const { query, redirectTo } = normalizeShowListQuery(await searchParams);
  if (redirectTo !== null) {
    redirect(redirectTo);
  }

  const showPage = await fetchShows({ client: createServerApiClient(), query });
  const lastPageHref = getLastPageRedirectHref({
    query,
    totalPages: showPage.totalPages,
  });
  if (lastPageHref !== null) {
    redirect(lastPageHref);
  }
  const cards = selectShowCards(showPage);
  const hasTitleQuery = query.q !== null;

  return (
    <main>
      <h1 className="mb-lg text-heading font-bold">공연</h1>
      {/* 검색 칸과 정렬은 비제어라, 뒤로 가기나 초기화 링크로 주소가 바뀌면 key로 새로 그려 주소의 값을 다시 채운다. */}
      <ShowListSearchForm key={query.q ?? ''} query={query} />
      <div className="mt-lg mb-md flex items-end justify-between gap-md">
        <p className="text-body-sm text-text-secondary">
          공연 {showPage.totalCount}개
        </p>
        <div className="w-[180px]">
          <ShowSortSelect key={query.sort} query={query} />
        </div>
      </div>
      {cards.length === 0 ? (
        <div className="py-2xl text-center">
          {hasTitleQuery ? (
            <>
              <p className="text-text-secondary">
                조건에 맞는 공연이 없습니다.
              </p>
              {/* 결과를 좁히는 조건만 지운다. 정렬은 결과를 줄이지 않으므로 그대로 둔다. */}
              <Link
                href={getShowListHref({ ...query, q: null, page: 1 })}
                className="mt-md inline-block font-semibold text-primary-strong hover:underline"
              >
                조건 초기화
              </Link>
            </>
          ) : (
            <p className="text-text-secondary">공연이 없습니다.</p>
          )}
        </div>
      ) : (
        <>
          <ShowCardList>
            {cards.map((card) => (
              <ShowCard key={card.id} card={card} />
            ))}
          </ShowCardList>
          <div className="mt-2xl">
            <ShowListPagination
              query={query}
              totalPages={showPage.totalPages}
            />
          </div>
        </>
      )}
    </main>
  );
}
