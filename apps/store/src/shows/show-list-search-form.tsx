import { SearchField } from '@openrun/store-ui';
import Form from 'next/form';
import {
  getSearchFormHiddenFields,
  SHOW_TITLE_QUERY_MAX_LENGTH,
  type ShowListQuery,
} from './show-list-query';

// 제목 검색 폼. API를 직접 부르지 않고 주소(/?q=정원)만 바꾼다. 바뀐 주소로 page.tsx가 서버에서 API를 불러 목록을 그린다.
// GET 폼이라 Enter나 돋보기 버튼으로 제출할 때 브라우저가 name 있는 입력 칸을 모아 쿼리 문자열을 만든다. 입력하는 도중에는 주소가 바뀌지 않는다.
// next/form은 이 이동을 새로고침 없는 화면 이동으로 바꾼다.
// 제출하면 쿼리 문자열이 폼 값으로 통째로 바뀌므로, 지금 정렬은 숨은 입력 칸으로 함께 보낸다. page는 보내지 않아 결과의 1페이지로 간다.
// 검색 칸은 헤더(레이아웃)에 있어 화면을 옮겨도 새로 만들어지지 않고, defaultValue는 처음 만들 때만 쓰인다.
// 그래서 뒤로 가기나 초기화 링크로 주소의 검색어가 바뀌면 부르는 쪽(HeaderSearch)이 key를 바꿔 폼을 새로 만들게 한다.
export function ShowListSearchForm({ query }: { query: ShowListQuery }) {
  const hiddenFields = getSearchFormHiddenFields(query);

  return (
    <Form action="/" role="search">
      <SearchField
        label="공연 제목 검색"
        name="q"
        placeholder="공연 제목으로 찾기"
        defaultValue={query.q ?? ''}
        maxLength={SHOW_TITLE_QUERY_MAX_LENGTH}
      />
      {hiddenFields.map(([name, value]) => (
        <input
          key={`${name}=${value}`}
          type="hidden"
          name={name}
          value={value}
        />
      ))}
    </Form>
  );
}
