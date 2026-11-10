import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  inject,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import { Clock } from '../src/clock/clock.module.js';
import { eq } from 'drizzle-orm';
import {
  performanceSeats,
  performances,
  shows,
} from '../src/db/schema/shows.js';
import { seats, sections, venues } from '../src/db/schema/venues.js';

// 테스트의 기본 현재 시각. 회차를 시작 일시만으로 넣으면 판매 오픈 일시가 DEFAULT_SALES_OPEN_AT이라,
// 이 시각 뒤에 시작하는 회차는 판매 중이다.
const DEFAULT_NOW = '2026-02-01T00:00:00Z';
const DEFAULT_SALES_OPEN_AT = '2026-01-01T01:00:00Z';
// 공연장 하나의 좌석 수.
const VENUE_SEAT_COUNT = 20;
// 포스터 URL은 이 값과 포스터 키를 합친다. 끝의 /는 있어도 없어도 같은 URL이 나온다.
const POSTER_BASE_URL = 'https://posters.example.com/openrun/';

interface PerformanceInput {
  startsAt: string;
  salesOpenAt?: string;
  isCancelled?: boolean;
  // 판매됨으로 둘 회차 좌석 수. 회차 좌석은 공연장의 좌석 수(VENUE_SEAT_COUNT)만큼 만든다.
  soldSeats?: number;
}

describe('GET /shows', () => {
  const db = drizzle(inject('databaseUrl'));
  let app: INestApplication<App>;
  // 테스트마다 바꿀 수 있는 현재 시각. 앱의 Clock이 이 값을 돌려준다.
  let now: Date;

  // 공연 하나와 그 회차를 넣고 공연 id를 돌려준다. 목록 응답에 나오지 않는 컬럼은 고정값으로 채운다.
  // 회차는 시작 일시만(performanceStarts) 주거나, 판매 오픈 일시와 회차 취소까지(performances) 준다.
  async function insertShow({
    venueId,
    title,
    posterKey = 'poster.png',
    performanceStarts = [],
    performances: performanceInputs = [],
  }: {
    venueId: number;
    title: string;
    posterKey?: string;
    performanceStarts?: string[];
    performances?: PerformanceInput[];
  }): Promise<number> {
    const [show] = await db
      .insert(shows)
      .values({
        venueId,
        title,
        genre: 'musical',
        minAge: 8,
        runningMinutes: 150,
        description: '소개',
        posterKey,
      })
      .returning({ id: shows.id });
    if (!show) {
      throw new Error('공연을 넣지 못했습니다.');
    }
    const rows: PerformanceInput[] = [
      ...performanceStarts.map((startsAt) => ({ startsAt })),
      ...performanceInputs,
    ];
    const venueSeats = await db
      .select({ id: seats.id })
      .from(seats)
      .innerJoin(sections, eq(sections.id, seats.sectionId))
      .where(eq(sections.venueId, venueId))
      .orderBy(seats.id);
    for (const {
      startsAt,
      salesOpenAt = DEFAULT_SALES_OPEN_AT,
      isCancelled,
      soldSeats = 0,
    } of rows) {
      const [performance] = await db
        .insert(performances)
        .values({
          showId: show.id,
          startsAt: new Date(startsAt),
          salesOpenAt: new Date(salesOpenAt),
          isCancelled,
        })
        .returning({ id: performances.id });
      if (!performance) {
        throw new Error('회차를 넣지 못했습니다.');
      }
      await db.insert(performanceSeats).values(
        venueSeats.map((seat, index) => ({
          performanceId: performance.id,
          seatId: seat.id,
          isSold: index < soldSeats,
        })),
      );
    }
    return show.id;
  }

  // 공연장과 구역 하나, 좌석 VENUE_SEAT_COUNT개를 넣고 공연장 id를 돌려준다.
  async function insertVenue(name: string): Promise<number> {
    const [venue] = await db
      .insert(venues)
      .values({ name })
      .returning({ id: venues.id });
    if (!venue) {
      throw new Error('공연장을 넣지 못했습니다.');
    }
    const [section] = await db
      .insert(sections)
      .values({ venueId: venue.id, name: 'A구역' })
      .returning({ id: sections.id });
    if (!section) {
      throw new Error('구역을 넣지 못했습니다.');
    }
    await db.insert(seats).values(
      Array.from({ length: VENUE_SEAT_COUNT }, (_, index) => ({
        sectionId: section.id,
        row: 'A',
        number: index + 1,
      })),
    );
    return venue.id;
  }

  beforeAll(() => {
    vi.stubEnv('DATABASE_URL', inject('databaseUrl'));
    vi.stubEnv('POSTER_BASE_URL', POSTER_BASE_URL);
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await db.$client.end();
  });

  beforeEach(async () => {
    await db.execute(
      'TRUNCATE performance_seats, performances, shows, seats, sections, venues RESTART IDENTITY CASCADE',
    );

    now = new Date(DEFAULT_NOW);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Clock)
      .useValue({ now: () => now })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('공연이 없으면 빈 첫 페이지를 돌려준다', async () => {
    const response = await request(app.getHttpServer()).get('/shows');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
      page: 1,
      size: 20,
      totalCount: 0,
      totalPages: 0,
    });
  });

  it('항목에 공연장 이름, 첫 회차부터 마지막 회차까지의 공연 기간, 포스터 URL을 담는다', async () => {
    const venueId = await insertVenue('샤롯데씨어터');
    await insertShow({
      venueId,
      title: '달빛 정원',
      posterKey: 'show-01.png',
      // 넣는 순서와 상관없이 가장 이른 회차와 가장 늦은 회차를 고른다.
      performanceStarts: [
        '2026-03-10T10:30:00Z',
        '2026-03-01T05:00:00Z',
        '2026-03-20T10:30:00Z',
      ],
    });

    const response = await request(app.getHttpServer()).get('/shows');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        {
          id: 1,
          title: '달빛 정원',
          genre: 'musical',
          venueName: '샤롯데씨어터',
          period: {
            start: '2026-03-01T05:00:00.000Z',
            end: '2026-03-20T10:30:00.000Z',
          },
          salesStatus: 'on_sale',
          salesOpenAt: null,
          posterUrl: 'https://posters.example.com/openrun/show-01.png',
        },
      ],
      page: 1,
      size: 20,
      totalCount: 1,
      totalPages: 1,
    });
  });

  it('첫 회차 일시가 이른 순으로, 같으면 id 순으로 정렬한다', async () => {
    const venueId = await insertVenue('예술의전당');
    await insertShow({
      venueId,
      title: '늦게 시작',
      performanceStarts: ['2026-05-01T10:00:00Z'],
    });
    await insertShow({
      venueId,
      title: '같은 시각 A',
      // 마지막 회차가 늦어도 첫 회차로 정렬한다.
      performanceStarts: ['2026-04-01T10:00:00Z', '2026-06-01T10:00:00Z'],
    });
    await insertShow({
      venueId,
      title: '같은 시각 B',
      performanceStarts: ['2026-04-01T10:00:00Z'],
    });
    await insertShow({
      venueId,
      title: '먼저 시작',
      performanceStarts: ['2026-03-01T10:00:00Z'],
    });

    const response = await request(app.getHttpServer()).get('/shows');

    expect(
      response.body.items.map((item: { title: string }) => item.title),
    ).toEqual(['먼저 시작', '같은 시각 A', '같은 시각 B', '늦게 시작']);
  });

  it('공연이 20개를 넘으면 첫 20개와 전체 개수, 전체 페이지 수를 돌려준다', async () => {
    const venueId = await insertVenue('예술의전당');
    for (let day = 1; day <= 21; day += 1) {
      await insertShow({
        venueId,
        title: `공연 ${day}`,
        performanceStarts: [
          `2026-03-${String(day).padStart(2, '0')}T10:00:00Z`,
        ],
      });
    }

    const response = await request(app.getHttpServer()).get('/shows');

    expect(response.body).toMatchObject({
      page: 1,
      size: 20,
      totalCount: 21,
      totalPages: 2,
    });
    expect(response.body.items).toHaveLength(20);
    expect(response.body.items.at(-1).title).toBe('공연 20');
  });

  it('회차가 없는 공연은 목록과 전체 개수에서 뺀다', async () => {
    const venueId = await insertVenue('예술의전당');
    await insertShow({ venueId, title: '회차 없음', performanceStarts: [] });

    const response = await request(app.getHttpServer()).get('/shows');

    expect(response.body).toMatchObject({ items: [], totalCount: 0 });
  });

  describe('판매 상태', () => {
    const salesOpenAt = '2026-03-01T05:00:00.000Z';
    const startsAt = '2026-03-10T10:00:00.000Z';

    function msBefore(iso: string, { ms }: { ms: number }): Date {
      return new Date(new Date(iso).getTime() - ms);
    }

    async function fetchSalesStatus(): Promise<unknown> {
      const response = await request(app.getHttpServer()).get('/shows');
      return response.body.items[0]?.salesStatus;
    }

    it.each([
      {
        moment: '판매 오픈 직전',
        at: msBefore(salesOpenAt, { ms: 1 }),
        expected: 'upcoming',
      },
      {
        moment: '판매 오픈 정각',
        at: new Date(salesOpenAt),
        expected: 'on_sale',
      },
    ])('$moment: $expected', async ({ at, expected }) => {
      const venueId = await insertVenue('예술의전당');
      await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [{ startsAt, salesOpenAt }],
      });
      now = at;

      expect(await fetchSalesStatus()).toBe(expected);
    });

    // 판매 종료 공연은 목록에서 빠지므로, 판매 예정 회차를 함께 두어 회차가 판매 종료가 되면 공연이 판매 예정으로 보이게 한다.
    it.each([
      {
        moment: '회차 시작 직전',
        at: msBefore(startsAt, { ms: 1 }),
        expected: 'on_sale',
      },
      {
        moment: '회차 시작 정각',
        at: new Date(startsAt),
        expected: 'upcoming',
      },
    ])('$moment: $expected', async ({ at, expected }) => {
      const venueId = await insertVenue('예술의전당');
      await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [
          { startsAt, salesOpenAt },
          {
            startsAt: '2026-04-10T10:00:00.000Z',
            salesOpenAt: '2026-03-20T05:00:00.000Z',
          },
        ],
      });
      now = at;

      expect(await fetchSalesStatus()).toBe(expected);
    });

    it('취소된 회차는 판매 오픈 전이어도 판매 종료라, 그 회차만 있는 공연은 목록에서 빠진다', async () => {
      const venueId = await insertVenue('예술의전당');
      await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [{ startsAt, salesOpenAt, isCancelled: true }],
      });
      now = msBefore(salesOpenAt, { ms: 1 });

      expect(await fetchSalesStatus()).toBeUndefined();
    });

    it('남은 회차 좌석이 0이어도 판매 중이다', async () => {
      const venueId = await insertVenue('예술의전당');
      await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [{ startsAt, salesOpenAt, soldSeats: VENUE_SEAT_COUNT }],
      });
      now = new Date(salesOpenAt);

      expect(await fetchSalesStatus()).toBe('on_sale');
    });

    it('남은 회차 좌석이 0이어도 판매 오픈 전이면 판매 예정이다', async () => {
      const venueId = await insertVenue('예술의전당');
      await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [{ startsAt, salesOpenAt, soldSeats: VENUE_SEAT_COUNT }],
      });
      now = msBefore(salesOpenAt, { ms: 1 });

      expect(await fetchSalesStatus()).toBe('upcoming');
    });
  });

  describe('공연 판매 상태', () => {
    // 기본 현재 시각(2026-02-01) 기준 회차 판매 상태별 회차
    const onSale = { startsAt: '2026-03-05T10:00:00Z' };
    const upcoming = {
      startsAt: '2026-03-01T10:00:00Z',
      salesOpenAt: '2026-02-10T05:00:00Z',
    };
    const cancelled = { startsAt: '2026-03-02T10:00:00Z', isCancelled: true };
    const ended = { startsAt: '2026-01-20T10:00:00Z' };
    const soldOut = {
      startsAt: '2026-03-03T10:00:00Z',
      soldSeats: VENUE_SEAT_COUNT,
    };

    it.each([
      {
        name: '판매 중 회차가 하나라도 있으면 판매 중이다',
        performances: [ended, cancelled, soldOut, upcoming, onSale],
        expected: { salesStatus: 'on_sale', salesOpenAt: null },
      },
      {
        name: '판매 중 회차가 없고 판매 예정 회차가 있으면 판매 예정이다',
        performances: [ended, cancelled, upcoming],
        expected: {
          salesStatus: 'upcoming',
          salesOpenAt: '2026-02-10T05:00:00.000Z',
        },
      },
      {
        name: '매진인 회차도 판매 중이라 판매 예정 회차보다 앞선다',
        performances: [soldOut, upcoming],
        expected: { salesStatus: 'on_sale', salesOpenAt: null },
      },
      {
        name: '끝난 회차와 취소된 회차 말고 남은 회차가 모두 매진이어도 판매 중이다',
        performances: [ended, cancelled, soldOut, soldOut],
        expected: { salesStatus: 'on_sale', salesOpenAt: null },
      },
    ])('$name', async ({ performances: inputs, expected }) => {
      const venueId = await insertVenue('예술의전당');
      await insertShow({ venueId, title: '달빛 정원', performances: inputs });

      const response = await request(app.getHttpServer()).get('/shows');

      expect(response.body.items[0]).toMatchObject(expected);
    });

    it('끝나지 않은 회차가 모두 취소됐으면 판매 종료라 목록과 전체 개수에서 뺀다', async () => {
      const venueId = await insertVenue('예술의전당');
      await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [ended, cancelled],
      });

      const response = await request(app.getHttpServer()).get('/shows');

      expect(response.body).toMatchObject({ items: [], totalCount: 0 });
    });

    it('판매 예정이면 판매 예정 회차 중 가장 이른 판매 오픈 일시를 담는다', async () => {
      const venueId = await insertVenue('예술의전당');
      await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [
          {
            startsAt: '2026-03-10T10:00:00Z',
            salesOpenAt: '2026-02-20T05:00:00Z',
          },
          {
            startsAt: '2026-03-11T10:00:00Z',
            salesOpenAt: '2026-02-15T05:00:00Z',
          },
          // 취소된 회차의 판매 오픈 일시는 고르지 않는다.
          {
            startsAt: '2026-03-12T10:00:00Z',
            salesOpenAt: '2026-02-05T05:00:00Z',
            isCancelled: true,
          },
        ],
      });

      const response = await request(app.getHttpServer()).get('/shows');

      expect(response.body.items[0]).toMatchObject({
        salesStatus: 'upcoming',
        salesOpenAt: '2026-02-15T05:00:00.000Z',
      });
    });
  });

  it('판매 종료 공연은 목록과 전체 개수에서 뺀다', async () => {
    const venueId = await insertVenue('예술의전당');
    await insertShow({
      venueId,
      title: '끝난 공연',
      performanceStarts: ['2026-01-10T10:00:00Z', '2026-01-20T10:00:00Z'],
    });
    await insertShow({
      venueId,
      title: '판매 중 공연',
      performanceStarts: ['2026-01-20T10:00:00Z', '2026-03-01T10:00:00Z'],
    });

    const response = await request(app.getHttpServer()).get('/shows');

    expect(
      response.body.items.map((item: { title: string }) => item.title),
    ).toEqual(['판매 중 공연']);
    expect(response.body).toMatchObject({ totalCount: 1, totalPages: 1 });
  });
});
