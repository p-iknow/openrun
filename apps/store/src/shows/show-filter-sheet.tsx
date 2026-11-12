'use client';

import { Drawer, ToggleGroup } from '@openrun/store-ui';
import { useRouter } from 'next/navigation';
import { startTransition, useOptimistic, useState } from 'react';
import { GENRE_ITEMS, STATUS_ITEMS } from './show-filter-items';
import {
  getFilterApplyHref,
  getGenreChangeQuery,
  getStatusChangeQuery,
  type ShowListQuery,
} from './show-list-query';

// 좁은 화면의 필터. "필터" 버튼으로 바텀 시트를 열고, 시트 안에서 장르와 판매 상태를 여러 개 고른 뒤 "적용"으로 한 번에 주소에 반영한다.
// 칩 줄처럼 누를 때마다 주소를 바꾸면 시트에 가린 목록이 칩마다 다시 그려지므로, 시트에서 고른 값은 주소와 따로 둔 임시 쿼리(draft)에만 둔다.
// 임시 쿼리는 칩 줄과 같은 함수로 고쳐, 모르는 값을 버리고 선택지 순서로 맞추는 규칙을 함께 쓴다.
// 적용하지 않고 닫으면 임시 쿼리를 버린다. 다음에 열 때 주소의 값으로 다시 채운다.
// 적용은 칩 줄과 같이 router.replace로 방문 기록을 쌓지 않는다.
// 버튼의 필터 개수는 서버가 새 목록을 그릴 때까지 기다리지 않도록 useOptimistic으로 적용한 쿼리를 먼저 보인다.
export function ShowFilterSheet({ query }: { query: ShowListQuery }) {
  const router = useRouter();
  const [draft, setDraft] = useState(query);
  const [shownQuery, setShownQuery] = useOptimistic(query);
  const selectedCount = shownQuery.genre.length + shownQuery.status.length;

  return (
    <Drawer.Root
      onOpenChange={(open) => {
        if (open) setDraft(query);
      }}
    >
      <Drawer.Trigger>
        {selectedCount > 0 ? `필터 ${selectedCount}` : '필터'}
      </Drawer.Trigger>
      <Drawer.Popup>
        <Drawer.Header>
          <Drawer.Title>필터</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <div className="flex flex-col gap-lg">
            <ToggleGroup
              label="장르"
              items={GENRE_ITEMS}
              value={draft.genre}
              onValueChange={(value) => {
                setDraft(getGenreChangeQuery({ query: draft, value }));
              }}
            />
            <ToggleGroup
              label="판매 상태"
              items={STATUS_ITEMS}
              value={draft.status}
              onValueChange={(value) => {
                setDraft(getStatusChangeQuery({ query: draft, value }));
              }}
            />
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close
            variant="primary"
            onClick={() => {
              startTransition(() => {
                setShownQuery(draft);
                router.replace(getFilterApplyHref(draft));
              });
            }}
          >
            적용
          </Drawer.Close>
        </Drawer.Footer>
      </Drawer.Popup>
    </Drawer.Root>
  );
}
