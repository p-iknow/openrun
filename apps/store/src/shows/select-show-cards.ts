import type { ShowPage } from './fetch-shows';

export interface ShowCardData {
  id: number;
  title: string;
  venueName: string;
  /** 한국 날짜로 바꾼 공연 기간. 예: `2026.03.01 ~ 2026.03.20` */
  period: string;
}

// 서버의 시간대와 상관없이 한국 날짜로 보여 준다.
const kstDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatDate(iso: string): string {
  const parts = kstDate.formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}.${part('month')}.${part('day')}`;
}

export function selectShowCards(page: ShowPage): ShowCardData[] {
  return page.items.map(({ id, title, venueName, period }) => {
    const start = formatDate(period.start);
    const end = formatDate(period.end);
    return {
      id,
      title,
      venueName,
      period: start === end ? start : `${start} ~ ${end}`,
    };
  });
}
