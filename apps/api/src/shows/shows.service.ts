import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, max, min, ne } from 'drizzle-orm';
import { Clock } from '../clock/clock.module.js';
import { DATABASE, type Database } from '../db/database.module.js';
import { performances, shows } from '../db/schema/shows.js';
import { venues } from '../db/schema/venues.js';
import type { ShowListQuery } from './show-list-query.js';
import type { ShowPageDto } from './show.dto.js';
import { POSTER_BASE_URL, buildPosterUrl } from './poster-url.js';
import { showSalesStatusSubquery } from './show-sales-status.js';

@Injectable()
export class ShowsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly clock: Clock,
    @Inject(POSTER_BASE_URL) private readonly posterBaseUrl: string,
  ) {}

  async findPage({ page, size, sort, q }: ShowListQuery): Promise<ShowPageDto> {
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
    // 목록과 전체 개수가 같은 조건을 써야 페이지 수가 맞는다. 판매 종료 공연은 목록에서 뺀다.
    const listCondition = and(
      ne(salesStatus.salesStatus, 'ended'),
      q ? ilike(shows.title, `%${escapeLikePattern(q)}%`) : undefined,
    );

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
        .where(listCondition)
        // 정렬값이 같으면 id로 순서를 고정해 페이지 사이에서 항목이 겹치거나 빠지지 않게 한다.
        // 최근 등록 순은 id도 큰 것(나중에 넣은 것)을 먼저 둔다.
        .orderBy(
          ...(sort === 'newest'
            ? [desc(shows.createdAt), desc(shows.id)]
            : [asc(period.start), asc(shows.id)]),
        )
        .limit(size)
        // 마지막 페이지를 넘으면 행이 없어 빈 items가 된다. 오류로 보지 않고 스토어가 리다이렉트를 정한다.
        .offset((page - 1) * size),
      this.db
        .select({ count: count() })
        .from(shows)
        .innerJoin(salesStatus, eq(salesStatus.showId, shows.id))
        .where(listCondition),
    ]);

    const totalCount = total?.count ?? 0;
    return {
      items: rows.map(({ start, end, salesOpenAt, posterPath, ...show }) => ({
        ...show,
        period: { start: toIso(start), end: toIso(end) },
        salesOpenAt: salesOpenAt?.toISOString() ?? null,
        posterUrl: buildPosterUrl({ baseUrl: this.posterBaseUrl, posterPath }),
      })),
      page,
      size,
      totalCount,
      totalPages: Math.ceil(totalCount / size),
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

// LIKE 패턴에서 특별한 뜻을 가진 %(여러 글자), _(한 글자), \(이스케이프 문자)를 글자 그대로 찾도록 앞에 \를 붙인다.
// PostgreSQL의 LIKE는 ESCAPE를 따로 적지 않으면 \를 이스케이프 문자로 쓴다.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
