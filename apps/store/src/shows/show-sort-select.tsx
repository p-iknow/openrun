'use client';

import { Select } from '@openrun/store-ui';
import { useRouter } from 'next/navigation';
import { getSortChangeHref, type ShowListQuery } from './show-list-query';
import { SORT_ITEMS } from './show-sort-items';

// 넓은 화면의 정렬. 좁은 화면에서는 ShowSortSheet가 대신한다. 정렬은 고르는 즉시 주소를 바꿔 적용한다. 장르·판매 상태 칩처럼 router.replace로 바꿔 방문 기록을 쌓지 않는다.
// Select는 비제어라 주소의 정렬이 바뀌어도 그대로다. 부르는 쪽이 key로 정렬을 넘겨 새로 그리게 한다.
export function ShowSortSelect({ query }: { query: ShowListQuery }) {
  const router = useRouter();

  return (
    <Select
      label="정렬"
      variant="inline"
      items={SORT_ITEMS}
      defaultValue={query.sort}
      onValueChange={(value) => {
        const href = getSortChangeHref({ query, value });
        if (href !== null) {
          router.replace(href);
        }
      }}
    />
  );
}
