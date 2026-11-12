import type { ToggleGroupItem } from '@openrun/store-ui';
import {
  GENRES,
  type Genre,
  SHOW_LIST_SALES_STATUSES,
  type ShowListSalesStatus,
} from './show-list-query';

// 장르와 판매 상태 칩에 보이는 이름. 넓은 화면의 칩 줄과 좁은 화면의 필터 줄, 필터 시트가 함께 쓴다.

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

export const GENRE_ITEMS: ToggleGroupItem[] = GENRES.map((genre) => ({
  value: genre,
  label: GENRE_LABELS[genre],
}));

export const STATUS_ITEMS: ToggleGroupItem[] = SHOW_LIST_SALES_STATUSES.map(
  (status) => ({
    value: status,
    label: STATUS_LABELS[status],
  }),
);

/**
 * 좁은 화면 필터 줄의 장르 칩 이름. 고른 장르가 없으면 "장르", 있으면 고른 이름을 쉼표로 잇는다(예: "뮤지컬,연극").
 * NOL 티켓 모바일 검색 결과의 필터 칩도 이렇게 보인다.
 */
export function getGenreChipLabel(genre: Genre[]): string {
  return getChipLabel({
    title: '장르',
    labels: genre.map((g) => GENRE_LABELS[g]),
  });
}

/** 좁은 화면 필터 줄의 판매 상태 칩 이름. 규칙은 `getGenreChipLabel`과 같다. */
export function getStatusChipLabel(status: ShowListSalesStatus[]): string {
  return getChipLabel({
    title: '판매 상태',
    labels: status.map((s) => STATUS_LABELS[s]),
  });
}

function getChipLabel({
  title,
  labels,
}: {
  /** 고른 값이 없을 때 보이는 묶음 이름 */
  title: string;
  /** 고른 값의 이름 */
  labels: string[];
}): string {
  return labels.length === 0 ? title : labels.join(',');
}
