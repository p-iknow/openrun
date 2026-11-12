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
function buildStatusLiteral(status: PerformanceSalesStatus): SQL {
  return sql.raw(`'${status}'`);
}

/**
 * 회차마다 전체 회차 좌석 수와 남은 회차 좌석 수를 세는 식이다. 회차 좌석을 LEFT JOIN하고 회차로 묶은 쿼리에서 쓴다.
 * 남은 좌석은 다른 테이블을 보지 않고 회차 좌석의 판매 여부만 세서 구한다.
 */
export function buildSeatCounts(): {
  totalSeats: SQL<number>;
  remainingSeats: SQL<number>;
} {
  return {
    totalSeats: sql<number>`count(${performanceSeats.id})`.mapWith(Number),
    remainingSeats:
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
export function buildPerformanceSalesStatus({
  now,
  remainingSeats,
}: {
  now: Date;
  remainingSeats: SQL<number>;
}): SQL<PerformanceSalesStatus> {
  return sql<PerformanceSalesStatus>`case
    when ${performances.isCancelled} then ${buildStatusLiteral('cancelled')}
    when ${performances.startsAt} <= ${now} then ${buildStatusLiteral('ended')}
    when ${now} < ${performances.salesOpenAt} then ${buildStatusLiteral('upcoming')}
    when ${remainingSeats} = 0 then ${buildStatusLiteral('sold_out')}
    else ${buildStatusLiteral('on_sale')}
  end`;
}

/**
 * 매진 임박 여부다. 판매 상태가 아니라 회차에 붙이는 표시다.
 * 판매 중(매진 아님)인 회차 중 남은 회차 좌석이 전체의 10% 이하이면 매진 임박이다.
 * 판매 중이면 남은 좌석이 0보다 크므로 따로 확인하지 않는다.
 */
export function buildAlmostSoldOutCondition({
  salesStatus,
  remainingSeats,
  totalSeats,
}: {
  salesStatus: SQL<PerformanceSalesStatus>;
  remainingSeats: SQL<number>;
  totalSeats: SQL<number>;
}): SQL<boolean> {
  // 정수 나눗셈을 피하려고 양쪽에 10을 곱해 비교한다.
  return sql<boolean>`(${salesStatus} = ${buildStatusLiteral('on_sale')} and ${remainingSeats} * 10 <= ${totalSeats})`;
}
