import { Button, TextField } from '@openrun/store-ui';
import Form from 'next/form';
import {
  getSearchFormHiddenFields,
  SHOW_TITLE_QUERY_MAX_LENGTH,
  type ShowListQuery,
} from './show-list-query';

// 제목 검색은 GET 폼 제출로 적용한다. 입력하는 도중에는 주소가 바뀌지 않고, Enter나 검색 버튼을 누를 때 바뀐다.
// next/form은 action이 문자열이면 폼 값으로 쿼리 문자열을 만들어 클라이언트 내비게이션으로 옮긴다.
// 지금 정렬은 숨은 필드로 함께 보내고 page는 보내지 않는다(getSearchFormHiddenFields).
// 검색 칸은 비제어라 주소의 검색어가 바뀌어도 그대로다. 부르는 쪽이 key로 검색어를 넘겨 새로 그리게 한다.
export function ShowListSearchForm({ query }: { query: ShowListQuery }) {
  const hiddenFields = getSearchFormHiddenFields(query);

  return (
    <Form action="/" role="search" className="flex items-end gap-sm">
      <div className="flex-1">
        <TextField
          label="공연 제목"
          name="q"
          type="search"
          placeholder="제목으로 찾기"
          defaultValue={query.q ?? ''}
          maxLength={SHOW_TITLE_QUERY_MAX_LENGTH}
        />
      </div>
      {hiddenFields.map(([name, value]) => (
        <input
          key={`${name}=${value}`}
          type="hidden"
          name={name}
          value={value}
        />
      ))}
      <Button type="submit">검색</Button>
    </Form>
  );
}
