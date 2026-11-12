import type { components } from '@openrun/api-client';
import { transformErrorResponse } from '../api-error';
import { formatKst } from '../format-kst';
import type { ShowDetailResult } from './fetch-show-detail';
import {
  getSalesOpenAtLabel,
  getShowPeriodLabel,
  type SalesStatusBadgeData,
  SHOW_SALES_STATUS_BADGES,
} from './select-show-cards';
import { GENRE_LABELS } from './show-filter-items';

type PerformanceSalesStatus = components['schemas']['PerformanceSalesStatus'];

export interface PerformanceItemData {
  id: number;
  /** 한국 시각. 예: `19:30` */
  time: string;
  salesStatus: SalesStatusBadgeData;
  /** 판매 중일 때만 보여 주는 남은 좌석. 예: `잔여 12석` */
  remainingSeats: string | null;
  isAlmostSoldOut: boolean;
}

export interface PerformanceDayData {
  /** 한국 날짜와 요일. 예: `2026.03.01 (일)` */
  date: string;
  performances: PerformanceItemData[];
}

export interface ShowDetailData {
  title: string;
  genre: string;
  venueName: string;
  /** 예: `2026.03.01 ~ 2026.03.20` */
  period: string;
  /** 예: `만 13세 이상`, `전체 관람가` */
  ageRating: string;
  /** 예: `120분` */
  runningTime: string;
  description: string;
  posterUrl: string;
  salesStatus: SalesStatusBadgeData;
  /** 판매 예정일 때 판매 오픈 일시. 예: `2026.03.01 14:00 판매 오픈` */
  salesOpenAt: string | null;
  /** 공연 판매 상태가 판매 종료인지. 회차 목록 대신 종료 안내를 보여 줄 때 쓴다. */
  isSalesEnded: boolean;
  /** 시작 전 회차를 한국 날짜별로 묶었다. API가 시작 일시 순으로 주므로 순서를 그대로 둔다. */
  performanceDays: PerformanceDayData[];
}

// Record로 적어 API에 판매 상태가 추가되면 여기서 타입 오류가 난다.
// 상세에는 시작 전 회차만 와서 판매 종료는 오지 않지만, 타입에 있는 값이라 함께 둔다.
const PERFORMANCE_SALES_STATUS_BADGES = {
  on_sale: { label: '판매 중', tone: 'primary' },
  upcoming: { label: '판매 예정', tone: 'success' },
  sold_out: { label: '매진', tone: 'neutral' },
  cancelled: { label: '회차 취소', tone: 'danger' },
  ended: { label: '판매 종료', tone: 'neutral' },
} satisfies Record<PerformanceSalesStatus, SalesStatusBadgeData>;

/**
 * 공연 상세 응답을 화면 값으로 바꾼다.
 * 없는 공연(SHOW_NOT_FOUND)이면 null을 돌려주고, 그 밖의 오류 응답은 ApiError로 던진다.
 */
export function selectShowDetail(
  result: ShowDetailResult,
): ShowDetailData | null {
  const show = result.data;
  if (show === undefined) {
    const apiError = transformErrorResponse({
      error: result.error,
      response: result.response,
    });
    if (apiError.code === 'SHOW_NOT_FOUND') {
      return null;
    }
    throw apiError;
  }

  const performanceDays: PerformanceDayData[] = [];
  for (const performance of show.performances) {
    const { date, weekday, time } = formatKst(performance.startsAt);
    const day = `${date} (${weekday})`;
    let group = performanceDays.at(-1);
    if (group?.date !== day) {
      group = { date: day, performances: [] };
      performanceDays.push(group);
    }
    group.performances.push({
      id: performance.id,
      time,
      salesStatus: PERFORMANCE_SALES_STATUS_BADGES[performance.salesStatus],
      // NOL 티켓처럼 남은 좌석은 지금 살 수 있는 회차에만 보여 준다. 매진과 회차 취소는 판매 상태 배지로 충분하다.
      remainingSeats:
        performance.salesStatus === 'on_sale'
          ? `잔여 ${performance.remainingSeats}석`
          : null,
      isAlmostSoldOut: performance.isAlmostSoldOut,
    });
  }

  return {
    title: show.title,
    genre: GENRE_LABELS[show.genre],
    venueName: show.venue.name,
    period: getShowPeriodLabel(show.period),
    ageRating: show.minAge === 0 ? '전체 관람가' : `만 ${show.minAge}세 이상`,
    runningTime: `${show.runningMinutes}분`,
    description: show.description,
    posterUrl: show.posterUrl,
    salesStatus: SHOW_SALES_STATUS_BADGES[show.salesStatus],
    salesOpenAt: getSalesOpenAtLabel(show.salesOpenAt),
    isSalesEnded: show.salesStatus === 'ended',
    performanceDays,
  };
}
