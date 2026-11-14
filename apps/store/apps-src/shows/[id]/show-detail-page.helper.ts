import * as R from 'remeda';
import { formatKst } from '@shared/helper/date/format-kst';
import type { ShowDetail } from '@shared/api/shows';
import { GENRE_LABELS } from '@shared/feature/show/helper/genre';
import { getSalesOpenAtLabel } from '@shared/feature/show/helper/sales-open-at';
import {
  PERFORMANCE_SALES_STATUS_BADGES,
  type SalesStatusBadgeData,
  SHOW_SALES_STATUS_BADGES,
} from '@shared/feature/show/helper/sales-status';
import { getShowPeriodLabel } from '@shared/feature/show/helper/show-period';

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
  /** 상세 이미지의 소개를 글로 옮긴 소개 본문. 상세 이미지가 있으면 화면 낭독기용 글 대체로 쓴다. */
  description: string;
  posterUrl: string;
  /** 공연 소개를 담은 세로로 긴 이미지들. 보여 줄 순서대로다. */
  detailImages: ShowDetail['detailImages'];
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
  // groupBy는 처음 나온 순서대로 날짜를 둔다('2026-03-01' 같은 키는 숫자 키가 아니라 넣은 순서가 지켜진다).
  const performanceDays: PerformanceDayData[] = R.pipe(
    show.performances,
    R.map((performance) => ({
      performance,
      kst: formatKst(performance.startsAt),
    })),
    R.groupBy(({ kst }) => kst.dateKey),
    R.values(),
    R.map((day) => ({
      date: day[0].kst.dateKey,
      label: `${day[0].kst.date} (${day[0].kst.weekday})`,
      performances: day.map(({ performance, kst }) => ({
        id: performance.id,
        time: kst.time,
        salesStatus: PERFORMANCE_SALES_STATUS_BADGES[performance.salesStatus],
        // NOL 티켓처럼 남은 좌석은 지금 살 수 있는 회차에만 보여 준다. 매진과 회차 취소는 판매 상태 배지로 충분하다.
        remainingSeats:
          performance.salesStatus === 'on_sale'
            ? `잔여 ${performance.remainingSeats}석`
            : null,
        isAlmostSoldOut: performance.isAlmostSoldOut,
      })),
    })),
  );

  return {
    title: show.title,
    genre: GENRE_LABELS[show.genre],
    venueName: show.venue.name,
    period: getShowPeriodLabel(show.period),
    ageRating: show.minAge === 0 ? '전체 관람가' : `만 ${show.minAge}세 이상`,
    runningTime: `${show.runningMinutes}분`,
    description: show.description,
    posterUrl: show.posterUrl,
    detailImages: show.detailImages,
    salesStatus: SHOW_SALES_STATUS_BADGES[show.salesStatus],
    salesOpenAt: getSalesOpenAtLabel(show.salesOpenAt),
    isSalesEnded: show.salesStatus === 'ended',
    performanceDays,
  };
}
