// 공연 목록 주소(`/?page=2`)의 쿼리를 다룬다. 주소에는 기본값과 다른 값만 남긴다.

/** 페이지 크기는 고정이라 주소에 넣지 않는다. */
export const SHOW_PAGE_SIZE = 20;

const LIST_PATH = '/';
const DEFAULT_PAGE = 1;

export interface ShowListQuery {
  /** 1부터 센다. */
  page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Next의 `searchParams`를 목록 쿼리로 정리한다. 모르는 쿼리는 버리고, 잘못된 `page`는 1로 고친다.
 * 정리한 주소가 원래 주소와 다르면 `redirectTo`에 정리된 주소를 담는다.
 */
export function normalizeShowListQuery(searchParams: SearchParams): {
  query: ShowListQuery;
  redirectTo: string | null;
} {
  const query = { page: parsePage(searchParams.page) };
  const href = showListHref(query);
  return {
    query,
    redirectTo: href === toHref(toSearch(searchParams)) ? null : href,
  };
}

/** 목록 쿼리로 주소를 만든다. 기본값은 주소에서 뺀다. 페이지 링크는 현재 쿼리에서 `page`만 바꿔 넘긴다. */
export function showListHref(query: ShowListQuery): string {
  const search = new URLSearchParams();
  if (query.page !== DEFAULT_PAGE) {
    search.set('page', String(query.page));
  }
  return toHref(search);
}

/**
 * API는 마지막 페이지를 넘는 요청에 빈 항목으로 응답한다. 그때 다른 쿼리는 그대로 두고 마지막 페이지 주소를 돌려준다.
 * 공연이 없으면(전체 페이지 수 0) 1페이지를 마지막 페이지로 본다.
 */
export function selectPastLastPageRedirect({
  query,
  totalPages,
}: {
  query: ShowListQuery;
  /** API 응답의 전체 페이지 수 */
  totalPages: number;
}): string | null {
  const lastPage = Math.max(DEFAULT_PAGE, totalPages);
  return query.page > lastPage
    ? showListHref({ ...query, page: lastPage })
    : null;
}

// 1 이상이고 JS가 정확히 다루는 정수만 받는다. "02"처럼 같은 수를 다르게 쓴 값도 잘못된 값으로 본다.
function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return DEFAULT_PAGE;
  }
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : DEFAULT_PAGE;
}

function toSearch(searchParams: SearchParams): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of [value ?? []].flat()) {
      search.append(key, item);
    }
  }
  return search;
}

function toHref(search: URLSearchParams): string {
  const query = search.toString();
  return query === '' ? LIST_PATH : `${LIST_PATH}?${query}`;
}
