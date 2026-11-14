import { formatKst } from '@shared/helper/date/format-kst';

// 판매 오픈 일시. 판매 예정이 아니면 null이다. 예: `2026.03.01 14:00 판매 오픈`
export function getSalesOpenAtLabel(salesOpenAt: string | null): string | null {
  if (salesOpenAt === null) {
    return null;
  }
  const open = formatKst(salesOpenAt);
  return `${open.date} ${open.time} 판매 오픈`;
}
