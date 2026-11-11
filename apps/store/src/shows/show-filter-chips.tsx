'use client';

import { ToggleGroup } from '@openrun/store-ui';
import { useRouter } from 'next/navigation';
import { startTransition, useOptimistic } from 'react';
import {
  GENRES,
  type Genre,
  getGenreChangeHref,
  getStatusChangeHref,
  SHOW_LIST_SALES_STATUSES,
  type ShowListQuery,
  type ShowListSalesStatus,
} from './show-list-query';

const GENRE_LABELS: Record<Genre, string> = {
  musical: '뮤지컬',
  play: '연극',
  concert: '콘서트',
  classical_dance: '클래식·무용',
  kids_family: '아동·가족',
};

const STATUS_LABELS: Record<ShowListSalesStatus, string> = {
  on_sale: '판매 중',
  upcoming: '판매 예정',
};

const GENRE_ITEMS = GENRES.map((genre) => ({
  value: genre,
  label: GENRE_LABELS[genre],
}));

const STATUS_ITEMS = SHOW_LIST_SALES_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}));

// 장르와 판매 상태 칩 줄. 칩을 누르는 즉시 주소를 바꿔 적용한다. 바뀐 주소로 page.tsx가 서버에서 목록을 다시 그린다.
// 주소는 router.replace로 바꿔 방문 기록을 쌓지 않는다. 필터를 여러 번 바꾼 뒤에도 뒤로 가기 한 번이면 목록에 오기 전 화면으로 간다.
// 주소에는 남기므로 새로고침, 공유, 상세에서 돌아오기에서도 필터가 그대로다. NOL 티켓 검색 결과의 필터도 이렇게 동작한다.
// 칩은 주소의 값을 그대로 보이는 제어 컴포넌트다. 정렬 Select처럼 key로 새로 만들면(리마운트) 누른 칩의 포커스가 사라지기 때문이다.
// 주소가 바뀌기까지 서버를 기다리는 동안에도 누른 결과가 바로 보이도록 useOptimistic으로 고른 값을 먼저 보인다.
// router.replace를 startTransition 안에서 부르면 새 화면이 그려질 때까지 transition이 이어지고, 끝나면 주소의 값으로 돌아간다.
// 초기화 링크나 뒤로 가기로 주소가 바뀌어도 query가 바뀌므로 칩이 따라간다.
export function ShowFilterChips({ query }: { query: ShowListQuery }) {
  const router = useRouter();
  const [genre, setOptimisticGenre] = useOptimistic<string[]>(query.genre);
  const [status, setOptimisticStatus] = useOptimistic<string[]>(query.status);

  return (
    <div className="flex flex-col gap-md">
      <ToggleGroup
        label="장르"
        items={GENRE_ITEMS}
        value={genre}
        onValueChange={(value) => {
          startTransition(() => {
            setOptimisticGenre(value);
            router.replace(getGenreChangeHref({ query, value }));
          });
        }}
      />
      <ToggleGroup
        label="판매 상태"
        items={STATUS_ITEMS}
        value={status}
        onValueChange={(value) => {
          startTransition(() => {
            setOptimisticStatus(value);
            router.replace(getStatusChangeHref({ query, value }));
          });
        }}
      />
    </div>
  );
}
