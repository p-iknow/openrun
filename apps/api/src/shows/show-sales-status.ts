import { type SQL, sql } from 'drizzle-orm';
import type { Database } from '../db/database.module.js';
import { performances } from '../db/schema/shows.js';

// 공연 판매 상태를 우선순위 순서로 적는다. 앞일수록 우선한다.
// 회차마다 이 순번을 계산해 가장 작은 값을 공연 판매 상태로 삼는다.
// 실제 예매 서비스처럼 매진과 회차 취소는 공연 판매 상태로 두지 않는다.
export const SHOW_SALES_STATUSES = ['on_sale', 'upcoming', 'ended'] as const;
export type ShowSalesStatus = (typeof SHOW_SALES_STATUSES)[number];

// 상수만 SQL에 그대로 넣는다. 사용자 입력이 아니므로 파라미터로 넘기지 않아도 안전하다.
function priorityOf(status: ShowSalesStatus): SQL {
  return sql.raw(String(SHOW_SALES_STATUSES.indexOf(status)));
}

function literalOf(status: ShowSalesStatus): SQL {
  return sql.raw(`'${status}'`);
}

// 회차 하나를 공연 판매 상태의 순번으로 계산한다. 위에서부터 먼저 맞는 것을 고른다.
// 취소된 회차는 더 팔 수 없으니 판매 종료로 센다.
// 남은 좌석은 보지 않는다. 매진인 회차도 판매 기간 안이면 취소표가 나올 수 있어 판매 중이다.
function performancePriority({ now }: { now: Date }): SQL<number> {
  return sql<number>`case
    when ${performances.isCancelled} or ${performances.startsAt} <= ${now} then ${priorityOf('ended')}
    when ${now} < ${performances.salesOpenAt} then ${priorityOf('upcoming')}
    else ${priorityOf('on_sale')}
  end`;
}

/**
 * 공연마다 공연 판매 상태와, 판매 예정이면 가장 이른 판매 오픈 일시를 계산하는 서브쿼리다.
 * 판매 상태는 저장하지 않으므로, 목록 쿼리와 개수 쿼리가 이 서브쿼리를 JOIN해 거르기와 개수를 같은 기준으로 맞춘다.
 * 회차가 없는 공연은 행이 없다.
 */
export function showSalesStatusSubquery(db: Database, { now }: { now: Date }) {
  const priority = performancePriority({ now });
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
    })
    .from(performances)
    .groupBy(performances.showId)
    .as('show_sales_status');
}
