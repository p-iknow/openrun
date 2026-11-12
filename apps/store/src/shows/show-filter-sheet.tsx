'use client';

import { Button, ToggleGroup } from '@openrun/store-ui';
import { useState } from 'react';
import { type PickerController, PickerSheet } from './picker-sheet';
import { GENRE_ITEMS, STATUS_ITEMS } from './show-filter-items';
import {
  getGenreChangeQuery,
  getStatusChangeQuery,
  type ShowListQuery,
} from './show-list-query';

/** 창을 열 때 보여 줄 부분. 필터 버튼으로 열면 맨 위부터 보인다. */
export type FilterSection = 'top' | 'genre' | 'status';

// 필터 창의 내용. ShowFilterBar가 overlay-kit의 `overlay.openAsync`로 열고, 이 창은 결과를 `controller.close`로 돌려준다.
// "적용"을 누르면 고친 임시 쿼리를, 적용하지 않고 닫으면 `null`을 돌려준다. 주소를 바꾸는 일은 여는 쪽이 한다.
//
// 고른 값은 주소와 따로 둔 임시 쿼리(draft)에만 둔다. 칩을 누를 때마다 주소를 바꾸면 창에 가린 목록이 칩마다 다시 그려지기 때문이다.
// NOL 티켓 모바일 필터 시트도 시트 안에서 고르고 아래 버튼으로 한 번에 적용한다.
// 창은 열 때마다 새로 그려지고 닫히면 트리에서 빠지므로, draft는 열 때 받은 `initialQuery`로 늘 새로 시작한다.
// 임시 쿼리는 getGenreChangeQuery, getStatusChangeQuery로 고쳐, 모르는 값을 버리고 선택지 순서로 맞추는 규칙을 주소 정리와 함께 쓴다.
// 칩은 draft를 그대로 보이는 제어 컴포넌트다. "초기화"가 바깥에서 값을 비워도 칩이 따라간다. 초기화는 창 안의 선택만 지우고 창을 닫지 않는다.
export function ShowFilterSheet({
  controller,
  initialQuery,
  section,
}: {
  controller: PickerController<ShowListQuery>;
  /** 열 때 칩에 채울 쿼리. 지금 화면에 보이는 쿼리를 넘긴다. */
  initialQuery: ShowListQuery;
  section: FilterSection;
}) {
  const [draft, setDraft] = useState(initialQuery);

  // 칩으로 열면 그 칩의 부분이 창 본문 맨 위에 오도록 스크롤한다. 창은 열 때마다 새로 그려지므로 부분이 그려질 때 한 번 불린다.
  // 브라우저가 가장 가까운 스크롤 상자(창 본문)를 찾아 스크롤한다.
  const scrollIntoSection = (element: HTMLElement | null) => {
    element?.scrollIntoView({ block: 'start' });
  };

  return (
    <PickerSheet
      controller={controller}
      title="필터"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft({ ...draft, genre: [], status: [] });
            }}
          >
            초기화
          </Button>
          <Button
            onClick={() => {
              controller.close(draft);
            }}
          >
            적용
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <div ref={section === 'genre' ? scrollIntoSection : undefined}>
          <ToggleGroup
            label="장르"
            items={GENRE_ITEMS}
            value={draft.genre}
            onValueChange={(value) => {
              setDraft(getGenreChangeQuery({ query: draft, value }));
            }}
          />
        </div>
        <div ref={section === 'status' ? scrollIntoSection : undefined}>
          <ToggleGroup
            label="판매 상태"
            items={STATUS_ITEMS}
            value={draft.status}
            onValueChange={(value) => {
              setDraft(getStatusChangeQuery({ query: draft, value }));
            }}
          />
        </div>
      </div>
    </PickerSheet>
  );
}
