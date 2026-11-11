'use client';

import { SearchField } from '@openrun/store-ui';
import { useRouter } from 'next/navigation';
import {
  getSearchSubmitHref,
  SHOW_TITLE_QUERY_MAX_LENGTH,
  type ShowListQuery,
} from './show-list-query';

const QUERY_FIELD_NAME = 'q';

// 제목 검색 폼. API를 직접 부르지 않고 주소(/?q=정원)만 바꾼다. 바뀐 주소로 page.tsx가 서버에서 API를 불러 목록을 그린다.
// Enter나 돋보기 버튼으로 제출하면, 정렬 Select처럼 지금 쿼리와 검색어로 주소를 만들어(getSearchSubmitHref) 옮겨 간다.
// 입력하는 도중에는 주소가 바뀌지 않는다.
// action="/"는 JS가 실행되기 전에 제출했을 때만 쓰인다. 브라우저가 보통 폼처럼 /?q=…로 보내고, 정렬은 이어지지 않는다.
// 검색 칸은 헤더(레이아웃)에 있어 화면을 옮겨도 새로 만들어지지 않고, defaultValue는 처음 만들 때만 쓰인다.
// 그래서 뒤로 가기나 초기화 링크로 주소의 검색어가 바뀌면 부르는 쪽(HeaderSearch)이 key를 바꿔 폼을 새로 만들게 한다.
export function ShowListSearchForm({ query }: { query: ShowListQuery }) {
  const router = useRouter();

  return (
    <form
      action="/"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get(QUERY_FIELD_NAME);
        router.push(
          getSearchSubmitHref({
            query,
            value: typeof value === 'string' ? value : '',
          }),
        );
      }}
    >
      <SearchField
        label="공연 제목 검색"
        name={QUERY_FIELD_NAME}
        placeholder="공연 제목으로 찾기"
        defaultValue={query.q ?? ''}
        maxLength={SHOW_TITLE_QUERY_MAX_LENGTH}
      />
    </form>
  );
}
