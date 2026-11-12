import { SHOW_SORTS, type ShowSort } from './show-list-query';

// 정렬 선택지에 보이는 이름. 장르·판매 상태 이름(show-filter-items.ts)처럼 화면 파일과 따로 둔다.

const SORT_LABELS: Record<ShowSort, string> = {
  start_date: '공연 시작일 순',
  newest: '최근 등록 순',
};

export const SORT_ITEMS: { value: ShowSort; label: string }[] = SHOW_SORTS.map(
  (sort) => ({
    value: sort,
    label: SORT_LABELS[sort],
  }),
);
