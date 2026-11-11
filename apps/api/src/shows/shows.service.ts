import { Inject, Injectable } from '@nestjs/common';
import { asc, count, eq, max, min, ne } from 'drizzle-orm';
import { Clock } from '../clock/clock.module.js';
import { DATABASE, type Database } from '../db/database.module.js';
import { performances, shows } from '../db/schema/shows.js';
import { venues } from '../db/schema/venues.js';
import type { ShowPageDto } from './show.dto.js';
import { POSTER_BASE_URL, buildPosterUrl } from './poster-url.js';
import { showSalesStatusSubquery } from './show-sales-status.js';

// 쿼리 파라미터는 뒤 티켓에서 받는다. 지금은 항상 첫 페이지 20개다.
const PAGE = 1;
const PAGE_SIZE = 20;

@Injectable()
export class ShowsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly clock: Clock,
    @Inject(POSTER_BASE_URL) private readonly posterBaseUrl: string,
  ) {}

  async findPage(): Promise<ShowPageDto> {
    // 공연 기간은 저장하지 않고 회차에서 계산한다. 회차가 없는 공연은 목록에 나오지 않는다.
    const period = this.db
      .select({
        showId: performances.showId,
        start: min(performances.startsAt).as('start'),
        end: max(performances.startsAt).as('end'),
      })
      .from(performances)
      .groupBy(performances.showId)
      .as('period');
    const salesStatus = showSalesStatusSubquery(this.db, {
      now: this.clock.now(),
    });
    // 판매 종료 공연은 목록에서 뺀다. 목록과 전체 개수가 같은 조건을 써야 페이지 수가 맞는다.
    const isListed = ne(salesStatus.salesStatus, 'ended');

    const [rows, [total]] = await Promise.all([
      this.db
        .select({
          id: shows.id,
          title: shows.title,
          genre: shows.genre,
          venueName: venues.name,
          start: period.start,
          end: period.end,
          salesStatus: salesStatus.salesStatus,
          salesOpenAt: salesStatus.salesOpenAt,
          posterPath: shows.posterPath,
        })
        .from(shows)
        .innerJoin(venues, eq(venues.id, shows.venueId))
        .innerJoin(period, eq(period.showId, shows.id))
        .innerJoin(salesStatus, eq(salesStatus.showId, shows.id))
        .where(isListed)
        // 첫 회차 일시가 같으면 id로 순서를 고정해 페이지 사이에서 항목이 겹치거나 빠지지 않게 한다.
        .orderBy(asc(period.start), asc(shows.id))
        .limit(PAGE_SIZE)
        .offset((PAGE - 1) * PAGE_SIZE),
      this.db
        .select({ count: count() })
        .from(shows)
        .innerJoin(salesStatus, eq(salesStatus.showId, shows.id))
        .where(isListed),
    ]);

    const totalCount = total?.count ?? 0;
    return {
      items: rows.map(({ start, end, salesOpenAt, posterPath, ...show }) => ({
        ...show,
        period: { start: toIso(start), end: toIso(end) },
        salesOpenAt: salesOpenAt?.toISOString() ?? null,
        posterUrl: buildPosterUrl({ baseUrl: this.posterBaseUrl, posterPath }),
      })),
      page: PAGE,
      size: PAGE_SIZE,
      totalCount,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
    };
  }
}

// min/max는 그룹에 행이 없을 때 null을 돌려주므로 타입이 nullable이다. INNER JOIN이라 실제로는 항상 값이 있다.
function toIso(value: Date | null): string {
  if (value === null) {
    throw new Error('회차가 없는 공연이 목록에 들어왔습니다.');
  }
  return value.toISOString();
}
