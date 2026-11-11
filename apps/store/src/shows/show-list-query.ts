import type { paths } from '@openrun/api-client';

// 공연 목록 주소(`/?q=정원&sort=newest&page=2`)의 쿼리를 다룬다. 주소에는 기본값과 다른 값만 남긴다.

/** 페이지 크기는 고정이라 주소에 넣지 않는다. */
export const SHOW_PAGE_SIZE = 20;

type ApiShowSort = NonNullable<
  NonNullable<paths['/shows']['get']['parameters']['query']>['sort']
>;

/** 정렬 선택지. API 계약이 바뀌면 `satisfies`가 타입 검사에서 알린다. */
export const SHOW_SORTS = [
  'start_date',
  'newest',
] as const satisfies readonly ApiShowSort[];
export type ShowSort = (typeof SHOW_SORTS)[number];

/**
 * API가 받는 검색어의 최대 길이. 넘는 값을 보내면 400이 오므로 미리 버린다.
 * 생성 타입에는 길이가 담기지 않아 타입 검사로 묶을 수 없다. API의 q 최대 길이(openapi.json의 maxLength)와 같게 둔다.
 */
export const SHOW_TITLE_QUERY_MAX_LENGTH = 50;

const LIST_PATH = '/';
const DEFAULT_PAGE = 1;
const DEFAULT_SORT: ShowSort = 'start_date';

export interface ShowListQuery {
  /** 1부터 센다. */
  page: number;
  /** 공연 제목 검색어. 앞뒤 공백을 지운 값이고, 검색하지 않으면 `null`이다. */
  q: string | null;
  sort: ShowSort;
}

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Next의 `searchParams`를 목록 쿼리로 정리한다. 모르는 쿼리와 잘못된 값은 버리거나 기본값으로 고친다.
 * 정리한 주소가 원래 주소와 다르면 `redirectTo`에 정리된 주소를 담는다.
 */
export function normalizeShowListQuery(searchParams: SearchParams): {
  query: ShowListQuery;
  redirectTo: string | null;
} {
  const query = {
    page: parsePage(searchParams.page),
    q: parseTitleQuery(searchParams.q),
    sort: parseSort(searchParams.sort),
  };
  const href = getShowListHref(query);
  return {
    query,
    redirectTo: href === toHref(toSearch(searchParams)) ? null : href,
  };
}

/**
 * 클라이언트에서 읽은 주소의 쿼리 문자열(`useSearchParams`)을 목록 쿼리로 정리한다.
 * Next의 `searchParams`와 같은 모양(한 번이면 글자, 여러 번이면 배열)으로 바꿔 같은 규칙을 쓴다.
 */
export function getShowListQueryFromSearch(
  search: URLSearchParams,
): ShowListQuery {
  const searchParams: SearchParams = {};
  for (const key of new Set(search.keys())) {
    const values = search.getAll(key);
    searchParams[key] = values.length === 1 ? values[0] : values;
  }
  return normalizeShowListQuery(searchParams).query;
}

/**
 * 목록 쿼리로 주소를 만든다. 기본값은 주소에서 빼고, 순서는 q, sort, page로 고정한다.
 * 페이지 링크는 현재 쿼리에서 `page`만 바꿔 넘긴다.
 */
export function getShowListHref(query: ShowListQuery): string {
  return toHref(getShowListSearchParams(query));
}

/**
 * 정렬 Select에서 고른 값으로 옮겨 갈 주소를 만든다. 검색어는 두고 page는 빼서 1페이지로 돌아간다.
 * 고른 값이 정렬 선택지가 아니면 `null`이다.
 */
export function getSortChangeHref({
  query,
  value,
}: {
  query: ShowListQuery;
  /** Select가 넘긴 값 */
  value: string;
}): string | null {
  const sort = findShowSort(value);
  return sort === undefined
    ? null
    : getShowListHref({ ...query, sort, page: DEFAULT_PAGE });
}

/**
 * 제목 검색 GET 폼이 검색어와 함께 보낼 숨은 필드의 [이름, 값] 목록이다.
 * 폼을 제출하면 쿼리 문자열이 폼 값으로 통째로 바뀌므로 지금 정렬을 함께 보낸다. page는 보내지 않아 1페이지로 돌아간다.
 */
export function getSearchFormHiddenFields(
  query: ShowListQuery,
): [name: string, value: string][] {
  return [
    ...getShowListSearchParams({ ...query, q: null, page: DEFAULT_PAGE }),
  ];
}

function getShowListSearchParams(query: ShowListQuery): URLSearchParams {
  const search = new URLSearchParams();
  if (query.q !== null) {
    search.set('q', query.q);
  }
  if (query.sort !== DEFAULT_SORT) {
    search.set('sort', query.sort);
  }
  if (query.page !== DEFAULT_PAGE) {
    search.set('page', String(query.page));
  }
  return search;
}

/**
 * API는 마지막 페이지를 넘는 요청에 빈 항목으로 응답한다. 그때 다른 쿼리는 그대로 두고 마지막 페이지 주소를 돌려준다.
 * 공연이 없으면(전체 페이지 수 0) 1페이지를 마지막 페이지로 본다.
 */
export function getLastPageRedirectHref({
  query,
  totalPages,
}: {
  query: ShowListQuery;
  /** API 응답의 전체 페이지 수 */
  totalPages: number;
}): string | null {
  const lastPage = Math.max(DEFAULT_PAGE, totalPages);
  return query.page > lastPage
    ? getShowListHref({ ...query, page: lastPage })
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

// API와 같이 앞뒤 공백을 지운 뒤 길이를 잰다. 빈 값과 너무 긴 값은 검색하지 않는다.
// 검색 칸이 maxLength로 길이를 막으므로, 너무 긴 값은 주소를 직접 고쳤을 때만 들어온다.
function parseTitleQuery(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const q = value.trim();
  return q === '' || q.length > SHOW_TITLE_QUERY_MAX_LENGTH ? null : q;
}

function parseSort(value: string | string[] | undefined): ShowSort {
  return (typeof value === 'string' && findShowSort(value)) || DEFAULT_SORT;
}

function findShowSort(value: string): ShowSort | undefined {
  return SHOW_SORTS.find((sort) => sort === value);
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
