import { count, eq, type SQL, sql } from 'drizzle-orm';
import type { Database } from '../db/database.module.js';
import { performanceSeats, performances } from '../db/schema/shows.js';

// 공연 판매 상태를 우선순위 순서로 적는다. 앞일수록 우선한다.
// 회차 판매 상태도 같은 값을 쓰므로, 회차마다 이 순번을 계산해 가장 작은 값을 공연 판매 상태로 삼는다.
// 매진이 판매 중, 판매 예정보다 뒤라 회차가 하나라도 판매 중이나 판매 예정이면 공연은 매진이 아니고,
// 회차 취소, 판매 종료보다 앞이라 끝난 회차와 취소된 회차는 공연의 매진 판단에서 빠진다.
export const SHOW_SALES_STATUSES = [
  'on_sale',
  'upcoming',
  'sold_out',
  'cancelled',
  'ended',
] as const;
export type ShowSalesStatus = (typeof SHOW_SALES_STATUSES)[number];

// 상수만 SQL에 그대로 넣는다. 사용자 입력이 아니므로 파라미터로 넘기지 않아도 안전하다.
function priorityOf(status: ShowSalesStatus): SQL {
  return sql.raw(String(SHOW_SALES_STATUSES.indexOf(status)));
}

function literalOf(status: ShowSalesStatus): SQL {
  return sql.raw(`'${status}'`);
}

// 회차마다 남은 좌석 수와 전체 좌석 수를 회차 좌석 테이블만 세서 구한다.
function seatCountSubquery(db: Database) {
  return db
    .select({
      performanceId: performanceSeats.performanceId,
      remaining:
        sql<number>`count(*) filter (where not ${performanceSeats.isSold})`
          .mapWith(Number)
          .as('remaining'),
      total: count().as('total'),
    })
    .from(performanceSeats)
    .groupBy(performanceSeats.performanceId)
    .as('seat_count');
}

// 회차 하나의 판매 상태를 우선순위 숫자로 계산한다. 위에서부터 먼저 맞는 것을 고른다.
// 회차 좌석이 없는 회차는 LEFT JOIN 결과가 null이라 남은 좌석을 0으로 본다.
function performancePriority({
  now,
  remaining,
}: {
  now: Date;
  remaining: SQL<number>;
}): SQL<number> {
  return sql<number>`case
    when ${performances.isCancelled} then ${priorityOf('cancelled')}
    when ${performances.startsAt} <= ${now} then ${priorityOf('ended')}
    when ${now} < ${performances.salesOpenAt} then ${priorityOf('upcoming')}
    when ${remaining} = 0 then ${priorityOf('sold_out')}
    else ${priorityOf('on_sale')}
  end`;
}

/**
 * 공연마다 공연 판매 상태, 판매 예정이면 가장 이른 판매 오픈 일시, 매진 임박 여부를 계산하는 서브쿼리다.
 * 판매 상태는 저장하지 않으므로, 목록과 상세가 이 서브쿼리를 JOIN해 필터, 개수, 페이지를 같은 기준으로 맞춘다.
 * 회차가 없는 공연은 행이 없다.
 */
export function showSalesStatusSubquery(db: Database, { now }: { now: Date }) {
  const seatCount = seatCountSubquery(db);
  const remaining = sql<number>`coalesce(${seatCount.remaining}, 0)`;
  const priority = performancePriority({ now, remaining });
  // 매진 임박: 판매 중인 회차 중 남은 좌석이 전체의 10% 이하인 회차다. 판매 중이면 남은 좌석이 0보다 크다.
  // 10%를 정수 곱셈으로 비교해 소수 반올림 오차를 피한다.
  const isAlmostSoldOut = sql`${priority} = ${priorityOf('on_sale')} and ${remaining} * 10 <= ${seatCount.total}`;
  const showPriority = sql`min(${priority})`;
  const toStatus = sql.join(
    SHOW_SALES_STATUSES.map(
      (status) => sql`when ${priorityOf(status)} then ${literalOf(status)}`,
    ),
    sql` `,
  );

  return db
    .select({
      showId: performances.showId,
      salesStatus:
        sql<ShowSalesStatus>`case ${showPriority} ${toStatus} end`.as(
          'sales_status',
        ),
      // 판매 예정 공연은 판매 중인 회차가 없으므로, 판매 예정 회차 중 가장 이른 판매 오픈 일시가 다음 오픈이다.
      salesOpenAt: sql<Date | null>`case
        when ${showPriority} = ${priorityOf('upcoming')}
        then min(${performances.salesOpenAt}) filter (where ${priority} = ${priorityOf('upcoming')})
      end`
        .mapWith(performances.salesOpenAt)
        .as('sales_open_at'),
      // 판매 중인 회차가 하나라도 있으면 공연 판매 상태가 판매 중이므로, 이 값이 참이면 공연은 늘 판매 중이다.
      isAlmostSoldOut: sql<boolean>`bool_or(${isAlmostSoldOut})`.as(
        'is_almost_sold_out',
      ),
    })
    .from(performances)
    .leftJoin(seatCount, eq(seatCount.performanceId, performances.id))
    .groupBy(performances.showId)
    .as('show_sales_status');
}
