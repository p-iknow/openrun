import { type SQL, sql } from 'drizzle-orm';
import { performanceSeats, performances } from '../db/schema/shows.js';

// 회차의 판매 상태(용어집의 판매 상태)다.
export const PERFORMANCE_SALES_STATUSES = [
  'upcoming',
  'on_sale',
  'sold_out',
  'cancelled',
  'ended',
] as const;
export type PerformanceSalesStatus =
  (typeof PERFORMANCE_SALES_STATUSES)[number];

// 상수만 SQL에 그대로 넣는다. 사용자 입력이 아니므로 파라미터로 넘기지 않아도 안전하다.
function toLiteralSql(status: PerformanceSalesStatus): SQL {
  return sql.raw(`'${status}'`);
}

/**
 * 회차마다 전체 회차 좌석 수와 남은 회차 좌석 수를 세는 식이다. 회차 좌석을 LEFT JOIN하고 회차로 묶은 쿼리에서 쓴다.
 * 남은 좌석은 다른 테이블을 보지 않고 회차 좌석의 판매 여부만 세서 구한다.
 */
export function buildSeatCountsSql(): {
  totalSeatsSql: SQL<number>;
  remainingSeatsSql: SQL<number>;
} {
  return {
    totalSeatsSql: sql<number>`count(${performanceSeats.id})`.mapWith(Number),
    remainingSeatsSql:
      sql<number>`count(${performanceSeats.id}) filter (where not ${performanceSeats.isSold})`.mapWith(
        Number,
      ),
  };
}

/**
 * 회차의 판매 상태를 계산한다. 위에서부터 먼저 맞는 것을 고른다.
 * 시각 경계는 목록의 공연 판매 상태(show-sales-status.ts)와 같다. 시작 일시 정각부터 판매 종료, 판매 오픈 일시 정각부터 판매 중이다.
 * 매진은 판매 오픈 뒤에만 센다. 판매 오픈 전이면 남은 좌석과 관계없이 판매 예정이다.
 */
export function buildPerformanceSalesStatusSql({
  now,
  remainingSeatsSql,
}: {
  now: Date;
  remainingSeatsSql: SQL<number>;
}): SQL<PerformanceSalesStatus> {
  return sql<PerformanceSalesStatus>`case
    when ${performances.isCancelled} then ${toLiteralSql('cancelled')}
    when ${performances.startsAt} <= ${now} then ${toLiteralSql('ended')}
    when ${now} < ${performances.salesOpenAt} then ${toLiteralSql('upcoming')}
    when ${remainingSeatsSql} = 0 then ${toLiteralSql('sold_out')}
    else ${toLiteralSql('on_sale')}
  end`;
}

/**
 * 매진 임박 여부다. 판매 상태가 아니라 회차에 붙이는 표시다.
 * 판매 중(매진 아님)인 회차 중 남은 회차 좌석이 전체의 10% 이하이면 매진 임박이다.
 * 판매 중이면 남은 좌석이 0보다 크므로 따로 확인하지 않는다.
 */
export function buildAlmostSoldOutCondition({
  salesStatusSql,
  remainingSeatsSql,
  totalSeatsSql,
}: {
  salesStatusSql: SQL<PerformanceSalesStatus>;
  remainingSeatsSql: SQL<number>;
  totalSeatsSql: SQL<number>;
}): SQL<boolean> {
  // 남은 좌석 / 전체 좌석이 0.1 이하인지 보려 했지만, PostgreSQL에서는 정수 나눗셈이 소수점을 버리므로 대신 남은 좌석 × 10이 전체 좌석 이하인지 본다.
  return sql<boolean>`(${salesStatusSql} = ${toLiteralSql('on_sale')} and ${remainingSeatsSql} * 10 <= ${totalSeatsSql})`;
}
