// 서버의 시간대와 상관없이 한국 시각으로 보여 준다.
const kstDateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * ISO 일시를 한국 날짜, 요일, 시각 글자로 나눠 돌려준다. dateKey는 달력처럼 날짜를 값으로 주고받을 때 쓴다.
 * 예: `2026-03-01T05:00:00Z` → `{ date: '2026.03.01', dateKey: '2026-03-01', weekday: '일', time: '14:00' }`
 */
export function formatKst(iso: string): {
  date: string;
  dateKey: string;
  weekday: string;
  time: string;
} {
  const parts = kstDateTime.formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    date: `${part('year')}.${part('month')}.${part('day')}`,
    dateKey: `${part('year')}-${part('month')}-${part('day')}`,
    weekday: part('weekday'),
    time: `${part('hour')}:${part('minute')}`,
  };
}
