import type { components } from '@openrun/api-client';
import type { BadgeTone } from '@openrun/store-ui';
import { formatKst } from '../format-kst';
import type { Genre } from './show-list-query';

// 공연 목록과 공연 상세, 필터가 함께 쓰는 화면 문구다.

type PerformanceSalesStatus = components['schemas']['PerformanceSalesStatus'];
type ShowSalesStatus = components['schemas']['ShowSalesStatus'];
type ShowPeriod = components['schemas']['ShowPeriodDto'];

export interface SalesStatusBadgeData {
  label: string;
  tone: BadgeTone;
}

export const GENRE_LABELS: Record<Genre, string> = {
  musical: '뮤지컬',
  play: '연극',
  concert: '콘서트',
  classical_dance: '클래식·무용',
  kids_family: '아동·가족',
};

// Record로 적어 API에 판매 상태가 추가되면 여기서 타입 오류가 난다.
// 상세에는 시작 전 회차만 와서 회차의 판매 종료는 오지 않지만, 공연 판매 상태와 함께 쓰므로 둔다.
export const PERFORMANCE_SALES_STATUS_BADGES = {
  on_sale: { label: '판매 중', tone: 'primary' },
  upcoming: { label: '판매 예정', tone: 'success' },
  sold_out: { label: '매진', tone: 'neutral' },
  cancelled: { label: '회차 취소', tone: 'danger' },
  ended: { label: '판매 종료', tone: 'neutral' },
} satisfies Record<PerformanceSalesStatus, SalesStatusBadgeData>;

// 공연 판매 상태의 값은 회차 판매 상태 중 셋이라, 같은 이름과 색을 쓴다. 판매 종료는 상세에서만 보인다.
export const SHOW_SALES_STATUS_BADGES = {
  on_sale: PERFORMANCE_SALES_STATUS_BADGES.on_sale,
  upcoming: PERFORMANCE_SALES_STATUS_BADGES.upcoming,
  ended: PERFORMANCE_SALES_STATUS_BADGES.ended,
} satisfies Record<ShowSalesStatus, SalesStatusBadgeData>;

// 공연 기간. 하루짜리 공연은 날짜 하나만 쓴다. 예: `2026.03.01 ~ 2026.03.20`
export function getShowPeriodLabel(period: ShowPeriod): string {
  const start = formatKst(period.start).date;
  const end = formatKst(period.end).date;
  return start === end ? start : `${start} ~ ${end}`;
}

// 판매 오픈 일시. 판매 예정이 아니면 null이다. 예: `2026.03.01 14:00 판매 오픈`
export function getSalesOpenAtLabel(salesOpenAt: string | null): string | null {
  if (salesOpenAt === null) {
    return null;
  }
  const open = formatKst(salesOpenAt);
  return `${open.date} ${open.time} 판매 오픈`;
}
