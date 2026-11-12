import type { components } from '@openrun/api-client';
import type { BadgeTone } from '@openrun/store-ui';
import { formatKst } from '../format-kst';
import type { ShowPage } from './fetch-shows';

type ShowSalesStatus = components['schemas']['ShowSalesStatus'];
type ShowPeriod = components['schemas']['ShowPeriodDto'];

export interface SalesStatusBadgeData {
  label: string;
  tone: BadgeTone;
}

export interface ShowCardData {
  id: number;
  title: string;
  venueName: string;
  /** 한국 날짜로 바꾼 공연 기간. 예: `2026.03.01 ~ 2026.03.20` */
  period: string;
  salesStatus: SalesStatusBadgeData;
  /** 판매 예정일 때 한국 시각으로 바꾼 판매 오픈 일시. 예: `2026.03.01 14:00 판매 오픈` */
  salesOpenAt: string | null;
  /** 3:4 포스터의 완전한 URL */
  posterUrl: string;
}

// Record로 적어 API에 판매 상태가 추가되면 여기서 타입 오류가 난다.
// 판매 종료 공연은 목록에 오지 않지만, 상세에서 보여 주므로 함께 둔다.
export const SHOW_SALES_STATUS_BADGES = {
  on_sale: { label: '판매 중', tone: 'primary' },
  upcoming: { label: '판매 예정', tone: 'success' },
  ended: { label: '판매 종료', tone: 'neutral' },
} satisfies Record<ShowSalesStatus, SalesStatusBadgeData>;

// 목록 카드와 공연 상세가 같은 모양으로 보여 주는 공연 기간. 하루짜리 공연은 날짜 하나만 쓴다.
export function getShowPeriodLabel(period: ShowPeriod): string {
  const start = formatKst(period.start).date;
  const end = formatKst(period.end).date;
  return start === end ? start : `${start} ~ ${end}`;
}

// 목록 카드와 공연 상세가 같은 모양으로 보여 주는 판매 오픈 일시. 판매 예정이 아니면 null이다.
export function getSalesOpenAtLabel(salesOpenAt: string | null): string | null {
  if (salesOpenAt === null) {
    return null;
  }
  const open = formatKst(salesOpenAt);
  return `${open.date} ${open.time} 판매 오픈`;
}

export function selectShowCards(page: ShowPage): ShowCardData[] {
  return page.items.map(
    ({
      id,
      title,
      venueName,
      period,
      salesStatus,
      salesOpenAt,
      posterUrl,
    }) => ({
      id,
      title,
      venueName,
      period: getShowPeriodLabel(period),
      salesStatus: SHOW_SALES_STATUS_BADGES[salesStatus],
      salesOpenAt: getSalesOpenAtLabel(salesOpenAt),
      posterUrl,
    }),
  );
}
