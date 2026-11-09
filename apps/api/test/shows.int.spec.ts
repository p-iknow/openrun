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
import { performances, shows } from '../src/db/schema/shows.js';
import { venues } from '../src/db/schema/venues.js';

describe('GET /shows', () => {
  const db = drizzle(inject('databaseUrl'));
  let app: INestApplication<App>;

  // 공연 하나와 그 회차를 넣고 공연 id를 돌려준다. 목록 응답에 나오지 않는 컬럼은 고정값으로 채운다.
  async function insertShow({
    venueId,
    title,
    performanceStarts,
  }: {
    venueId: number;
    title: string;
    performanceStarts: string[];
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
      })
      .returning({ id: shows.id });
    if (!show) {
      throw new Error('공연을 넣지 못했습니다.');
    }
    if (performanceStarts.length > 0) {
      await db.insert(performances).values(
        performanceStarts.map((startsAt) => ({
          showId: show.id,
          startsAt: new Date(startsAt),
          salesOpenAt: new Date('2026-01-01T01:00:00Z'),
        })),
      );
    }
    return show.id;
  }

  async function insertVenue(name: string): Promise<number> {
    const [venue] = await db
      .insert(venues)
      .values({ name })
      .returning({ id: venues.id });
    if (!venue) {
      throw new Error('공연장을 넣지 못했습니다.');
    }
    return venue.id;
  }

  beforeAll(() => {
    vi.stubEnv('DATABASE_URL', inject('databaseUrl'));
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await db.$client.end();
  });

  beforeEach(async () => {
    await db.execute(
      'TRUNCATE performances, shows, venues RESTART IDENTITY CASCADE',
    );

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('항목에 공연장 이름과 첫 회차부터 마지막 회차까지의 공연 기간을 담는다', async () => {
    const venueId = await insertVenue('샤롯데씨어터');
    await insertShow({
      venueId,
      title: '달빛 정원',
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
});
