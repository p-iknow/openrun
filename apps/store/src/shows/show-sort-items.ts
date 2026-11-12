import { SHOW_SORTS, type ShowSort } from './show-list-query';

// 정렬 선택지에 보이는 이름. 넓은 화면의 정렬 Select와 좁은 화면의 정렬 시트가 함께 쓴다.

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
