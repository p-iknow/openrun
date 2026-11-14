import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * ISO 일시를 한국 날짜, 요일, 시각 글자로 나눠 돌려준다. 서버의 시간대와 상관없이 한국 시각으로 보여 준다.
 * dateKey는 달력처럼 날짜를 값으로 주고받을 때 쓴다.
 * 예: `2026-03-01T05:00:00Z` → `{ date: '2026.03.01', dateKey: '2026-03-01', weekday: '일', time: '14:00' }`
 */
export function formatKst(iso: string): {
  date: string;
  dateKey: string;
  weekday: string;
  time: string;
} {
  const kst = new TZDate(iso, 'Asia/Seoul');
  return {
    date: format(kst, 'yyyy.MM.dd'),
    dateKey: format(kst, 'yyyy-MM-dd'),
    weekday: format(kst, 'EEE', { locale: ko }),
    time: format(kst, 'HH:mm'),
  };
}
