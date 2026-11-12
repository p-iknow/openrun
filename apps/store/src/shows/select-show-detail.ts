import { formatKst } from '../format-kst';
import type { ShowDetail } from './fetch-show-detail';
import {
  GENRE_LABELS,
  getSalesOpenAtLabel,
  getShowPeriodLabel,
  PERFORMANCE_SALES_STATUS_BADGES,
  type SalesStatusBadgeData,
  SHOW_SALES_STATUS_BADGES,
} from './show-display';

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
  /** 달력에서 날짜를 가리키는 값(한국 날짜). 예: `2026-03-01` */
  date: string;
  /** 한국 날짜와 요일. 예: `2026.03.01 (일)` */
  label: string;
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
  /** 시작 전 회차를 한국 날짜별로 묶었다. API가 시작 일시 순으로 주므로 날짜와 회차 모두 이른 순이다. */
  performanceDays: PerformanceDayData[];
}

// 공연 상세 응답을 화면 값으로 바꾼다.
export function selectShowDetail(show: ShowDetail): ShowDetailData {
  const performanceDays: PerformanceDayData[] = [];
  for (const performance of show.performances) {
    const { date, dateKey, weekday, time } = formatKst(performance.startsAt);
    let group = performanceDays.at(-1);
    if (group?.date !== dateKey) {
      group = {
        date: dateKey,
        label: `${date} (${weekday})`,
        performances: [],
      };
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
