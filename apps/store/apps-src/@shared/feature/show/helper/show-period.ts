import type { components } from '@openrun/api-client';
import { formatKst } from '@shared/helper/date/format-kst';

type ShowPeriod = components['schemas']['ShowPeriodDto'];

// 공연 기간. 하루짜리 공연은 날짜 하나만 쓴다. 예: `2026.03.01 ~ 2026.03.20`
export function getShowPeriodLabel(period: ShowPeriod): string {
  const start = formatKst(period.start).date;
  const end = formatKst(period.end).date;
  return start === end ? start : `${start} ~ ${end}`;
}
