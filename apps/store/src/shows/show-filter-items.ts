import type { ToggleGroupItem } from '@openrun/store-ui';
import {
  GENRES,
  type Genre,
  SHOW_LIST_SALES_STATUSES,
  type ShowListSalesStatus,
} from './show-list-query';

// 장르와 판매 상태 칩에 보이는 이름. 넓은 화면의 칩 줄과 좁은 화면의 필터 시트가 함께 쓴다.

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
