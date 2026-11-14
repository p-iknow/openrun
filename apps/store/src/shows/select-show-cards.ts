import type { ShowPage } from '../api/shows';
import {
  getSalesOpenAtLabel,
  getShowPeriodLabel,
  type SalesStatusBadgeData,
  SHOW_SALES_STATUS_BADGES,
} from '../helpers/show.helpers';

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
