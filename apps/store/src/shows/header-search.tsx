'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { getShowListQueryFromSearch } from './show-list-query';
import { ShowListSearchForm } from './show-list-search-form';

const LIST_PATH = '/';

// 예매 사이트처럼 헤더의 로고 옆에 제목 검색을 둔다. 어느 화면에서 검색해도 공연 목록으로 간다.
// 레이아웃은 searchParams를 받지 못하므로 클라이언트에서 주소를 읽는다.
// 목록 화면에서는 주소의 검색어로 칸을 채우고 정렬을 함께 보낸다. 다른 화면에서는 새 검색으로 본다.
// 헤더는 화면을 옮겨도 새로 만들어지지 않아(리마운트되지 않아), 검색 칸에는 사용자가 마지막에 쓴 글자가 남는다(defaultValue는 마운트할 때만 쓰인다).
// 그래서 검색어를 key로 줘서, 뒤로 가기나 초기화 링크로 주소의 검색어가 바뀌면 폼을 새로 만들어(리마운트) 주소의 값을 다시 채운다.
export function HeaderSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = getShowListQueryFromSearch(
    pathname === LIST_PATH ? searchParams : new URLSearchParams(),
  );

  return <ShowListSearchForm key={query.q ?? ''} query={query} />;
}
