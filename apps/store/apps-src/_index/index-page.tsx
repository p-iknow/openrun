import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createServerApiClient } from '@shared/api/client';
import { fetchShows } from '@shared/api/shows';
import {
  getConditionResetHref,
  getFetchShowsQuery,
  getLastPageRedirectHref,
  hasNarrowingCondition,
  normalizeShowListQuery,
  type SearchParams,
} from '@shared/feature/show/helper/show-list-query';
import { selectShowCards } from './index-page.helper';
import { ShowCard, ShowCardList } from './index-page.sub/show-card';
import { ShowFilterBar } from './index-page.sub/show-filter-bar/show-filter-bar';
import { ShowListPagination } from './index-page.sub/show-list-pagination';

// 공연 목록(`/`). 주소의 쿼리로 검색, 필터, 정렬, 페이지를 정한다.
export async function IndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // 이 페이지는 빌드 때 미리 그리지 않고 요청마다 렌더링한다. 그래서 빌드에 API와 DB가 필요 없다.
  await connection();
  // 잘못 고친 주소는 오류 화면 대신 정리된 주소로 보낸다. API를 부르기 전에 정리해 400 응답을 받지 않는다.
  const { query, redirectTo } = normalizeShowListQuery(searchParams);
  if (redirectTo !== null) {
    redirect(redirectTo);
  }

  const showPage = await fetchShows({
    client: createServerApiClient(),
    query: getFetchShowsQuery(query),
  });
  const lastPageHref = getLastPageRedirectHref({
    query,
    totalPages: showPage.totalPages,
  });
  if (lastPageHref !== null) {
    redirect(lastPageHref);
  }
  const cards = selectShowCards(showPage);

  return (
    <main>
      <h1 className="mb-lg text-heading font-bold">공연</h1>
      {/* NOL 티켓 모바일 검색 결과처럼 칩·필터·정렬 버튼을 한 줄에 둔다. 필터 줄은 화면 폭과 관계없이 같고, 고르는 창은 좁은 화면에서 바텀 시트, 넓은 화면에서 가운데 대화상자다(ShowFilterBar). */}
      <div className="mb-lg">
        <ShowFilterBar query={query} />
      </div>
      <p className="mb-md font-semibold">공연 {showPage.totalCount}개</p>
      {cards.length === 0 ? (
        <div className="py-2xl text-center">
          {hasNarrowingCondition(query) ? (
            <>
              <p className="text-text-secondary">
                조건에 맞는 공연이 없습니다.
              </p>
              <Link
                href={getConditionResetHref(query)}
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
