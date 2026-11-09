import type { components } from '@openrun/api-client';
import type { BadgeTone } from '@openrun/store-ui';
import type { ShowPage } from './fetch-shows';

type ShowSalesStatus = components['schemas']['ShowSalesStatus'];

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
}

// Record로 적어 API에 판매 상태가 추가되면 여기서 타입 오류가 난다.
// 판매 종료 공연은 목록에 오지 않지만, 상세처럼 다른 화면에서 받을 수 있어 함께 둔다.
const SALES_STATUS_BADGES = {
  on_sale: { label: '판매 중', tone: 'primary' },
  upcoming: { label: '판매 예정', tone: 'success' },
  cancelled: { label: '회차 취소', tone: 'danger' },
  ended: { label: '판매 종료', tone: 'neutral' },
} satisfies Record<ShowSalesStatus, SalesStatusBadgeData>;

// 서버의 시간대와 상관없이 한국 시각으로 보여 준다.
const kstDateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function formatKst(iso: string) {
  const parts = kstDateTime.formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    date: `${part('year')}.${part('month')}.${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  };
}

export function selectShowCards(page: ShowPage): ShowCardData[] {
  return page.items.map(
    ({ id, title, venueName, period, salesStatus, salesOpenAt }) => {
      const start = formatKst(period.start).date;
      const end = formatKst(period.end).date;
      const open = salesOpenAt === null ? null : formatKst(salesOpenAt);
      return {
        id,
        title,
        venueName,
        period: start === end ? start : `${start} ~ ${end}`,
        salesStatus: SALES_STATUS_BADGES[salesStatus],
        salesOpenAt:
          open === null ? null : `${open.date} ${open.time} 판매 오픈`,
      };
    },
  );
}
