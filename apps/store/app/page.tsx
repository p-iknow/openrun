import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createServerApiClient } from '../src/api-client';
import { fetchShows } from '../src/shows/fetch-shows';
import { selectShowCards } from '../src/shows/select-show-cards';
import { ShowCard, ShowCardList } from '../src/shows/show-card';
import { ShowListPagination } from '../src/shows/show-list-pagination';
import { ShowFilterChips } from '../src/shows/show-filter-chips';
import { ShowFilterSheet } from '../src/shows/show-filter-sheet';
import {
  getConditionResetHref,
  getLastPageRedirectHref,
  hasNarrowingCondition,
  normalizeShowListQuery,
} from '../src/shows/show-list-query';
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

  return (
    <main>
      <h1 className="mb-lg text-heading font-bold">공연</h1>
      {/* 넓은 화면은 칩 줄, 좁은 화면은 필터 버튼과 시트다. 화면 폭을 JS로 읽으면 서버가 그린 HTML과 첫 렌더링이 달라져
          hydration 불일치가 나므로, 둘 다 그리고 CSS로 하나만 보인다. 브레이크포인트는 공연 카드 배치와 같은 sm이다. */}
      <div className="mb-xl hidden sm:block">
        <ShowFilterChips query={query} />
      </div>
      <div className="mb-xl sm:hidden">
        <ShowFilterSheet query={query} />
      </div>
      {/* 예매 사이트처럼 결과 수와 정렬을 목록 바로 위 한 줄에 둔다. 제목 검색은 헤더에 있다. */}
      <div className="mb-md flex items-center justify-between gap-md">
        <p className="font-semibold">공연 {showPage.totalCount}개</p>
        {/* 정렬은 비제어라, 뒤로 가기나 초기화 링크로 주소가 바뀌면 key로 새로 만들어(리마운트) 주소의 값을 다시 채운다. */}
        <ShowSortSelect key={query.sort} query={query} />
      </div>
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
