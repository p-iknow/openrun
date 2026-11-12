import { type SQL, sql } from 'drizzle-orm';
import { performances } from '../db/schema/shows.js';

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

// 남은 좌석을 보기 전까지의 판매 상태다. 매진은 판매 중에 들어 있다.
export type PerformanceSalesPhase = Exclude<PerformanceSalesStatus, 'sold_out'>;

// 상수만 SQL에 그대로 넣는다. 사용자 입력이 아니므로 파라미터로 넘기지 않아도 안전하다.
export function literalOf(status: PerformanceSalesStatus): SQL {
  return sql.raw(`'${status}'`);
}

/**
 * 회차의 판매 상태를 시각만으로 계산한다. 위에서부터 먼저 맞는 것을 고른다.
 * 남은 좌석은 보지 않으므로 매진인 회차도 판매 기간 안이면 판매 중이다.
 * 공연 판매 상태(목록)와 회차 판매 상태(상세)가 모두 이 식에서 시작해, 두 화면의 시간 경계가 어긋나지 않는다.
 */
export function performanceSalesPhase({
  now,
}: {
  now: Date;
}): SQL<PerformanceSalesPhase> {
  return sql<PerformanceSalesPhase>`case
    when ${performances.isCancelled} then ${literalOf('cancelled')}
    when ${performances.startsAt} <= ${now} then ${literalOf('ended')}
    when ${now} < ${performances.salesOpenAt} then ${literalOf('upcoming')}
    else ${literalOf('on_sale')}
  end`;
}

/**
 * 회차의 판매 상태다. 시각으로 정한 판매 중 회차 중 남은 회차 좌석이 0이면 매진이다.
 * remainingSeats는 그 회차의 남은 회차 좌석 수를 세는 식이다.
 */
export function performanceSalesStatus({
  now,
  remainingSeats,
}: {
  now: Date;
  remainingSeats: SQL<number>;
}): SQL<PerformanceSalesStatus> {
  const phase = performanceSalesPhase({ now });
  return sql<PerformanceSalesStatus>`case
    when ${phase} = ${literalOf('on_sale')} and ${remainingSeats} = 0 then ${literalOf('sold_out')}
    else ${phase}
  end`;
}

/**
 * 매진 임박 여부다. 판매 상태가 아니라 회차에 붙이는 표시다.
 * 판매 중(매진 아님)인 회차 중 남은 회차 좌석이 전체의 10% 이하이면 매진 임박이다.
 * 판매 중이면 남은 좌석이 0보다 크므로 따로 확인하지 않는다.
 */
export function almostSoldOutCondition({
  salesStatus,
  remainingSeats,
  totalSeats,
}: {
  salesStatus: SQL<PerformanceSalesStatus>;
  remainingSeats: SQL<number>;
  totalSeats: SQL<number>;
}): SQL<boolean> {
  // 정수 나눗셈을 피하려고 양쪽에 10을 곱해 비교한다.
  return sql<boolean>`(${salesStatus} = ${literalOf('on_sale')} and ${remainingSeats} * 10 <= ${totalSeats})`;
}
