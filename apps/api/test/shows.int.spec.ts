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
import { and, eq, inArray } from 'drizzle-orm';
import {
  type Genre,
  performanceSeats,
  performances,
  seatGradeAssignments,
  seatGrades,
  showDetailImages,
  shows,
} from '../src/db/schema/shows.js';
import { seats, sections, venues } from '../src/db/schema/venues.js';

// 테스트의 기본 현재 시각. 회차를 시작 일시만으로 넣으면 판매 오픈 일시가 DEFAULT_SALES_OPEN_AT이라,
// 이 시각 뒤에 시작하는 회차는 판매 중이다.
const DEFAULT_NOW = '2026-02-01T00:00:00Z';
const DEFAULT_SALES_OPEN_AT = '2026-01-01T01:00:00Z';
// 공연 등록 일시를 주지 않으면 쓰는 값. DB 기본값(now())은 테스트마다 달라지므로 늘 직접 넣는다.
const DEFAULT_CREATED_AT = '2025-12-01T00:00:00Z';
// 공연장 하나의 좌석 수.
const VENUE_SEAT_COUNT = 20;
// 공연 이미지 URL은 이 값과 저장소 안 경로를 합친다. 끝의 /는 있어도 없어도 같은 URL이 나온다.
const SHOW_IMAGE_BASE_URL = 'https://images.example.com/openrun/';

interface PerformanceInput {
  startsAt: string;
  salesOpenAt?: string;
  isCancelled?: boolean;
  // 판매됨으로 둘 회차 좌석 수. 회차 좌석은 공연장의 좌석 수(VENUE_SEAT_COUNT)만큼 만든다.
  soldSeats?: number;
}

const db = drizzle(inject('databaseUrl'));
let app: INestApplication<App>;
// 테스트마다 바꿀 수 있는 현재 시각. 앱의 Clock이 이 값을 돌려준다.
let now: Date;

// 공연 하나와 그 회차를 넣고 공연 id를 돌려준다. 주지 않은 컬럼은 고정값으로 채운다.
// 회차는 시작 일시만(performanceStarts) 주거나, 판매 오픈 일시와 회차 취소까지(performances) 준다.
async function insertShow({
  venueId,
  title,
  genre = 'musical',
  posterPath = 'posters/poster.png',
  createdAt = DEFAULT_CREATED_AT,
  minAge = 8,
  runningMinutes = 150,
  description = '소개',
  performanceStarts = [],
  performances: performanceInputs = [],
  detailImages = [],
}: {
  venueId: number;
  title: string;
  genre?: Genre;
  posterPath?: string;
  createdAt?: string;
  minAge?: number;
  runningMinutes?: number;
  description?: string;
  performanceStarts?: string[];
  performances?: PerformanceInput[];
  // 상세 이미지. position은 넣은 순서와 따로 준다.
  detailImages?: { position: number; path: string }[];
}): Promise<number> {
  const [show] = await db
    .insert(shows)
    .values({
      venueId,
      title,
      genre,
      minAge,
      runningMinutes,
      description,
      posterPath,
      createdAt: new Date(createdAt),
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
  if (detailImages.length > 0) {
    await db
      .insert(showDetailImages)
      .values(detailImages.map((image) => ({ ...image, showId: show.id })));
  }
  return show.id;
}

// 공연장 하나의 구역 배치. 구역마다 열 이름 목록과 열당 좌석 수만큼 좌석을 만든다.
interface SectionInput {
  name: string;
  rows: string[];
  seatsPerRow: number;
}

// 공연장과 구역, 좌석을 넣고 공연장 id를 돌려준다. 구역을 주지 않으면 A구역 A열에 좌석 VENUE_SEAT_COUNT개를 둔다.
async function insertVenue(
  name: string,
  {
    sections: sectionInputs = [
      { name: 'A구역', rows: ['A'], seatsPerRow: VENUE_SEAT_COUNT },
    ],
  }: { sections?: SectionInput[] } = {},
): Promise<number> {
  const [venue] = await db
    .insert(venues)
    .values({ name })
    .returning({ id: venues.id });
  if (!venue) {
    throw new Error('공연장을 넣지 못했습니다.');
  }
  for (const { name: sectionName, rows, seatsPerRow } of sectionInputs) {
    const [section] = await db
      .insert(sections)
      .values({ venueId: venue.id, name: sectionName })
      .returning({ id: sections.id });
    if (!section) {
      throw new Error('구역을 넣지 못했습니다.');
    }
    await db.insert(seats).values(
      rows.flatMap((row) =>
        Array.from({ length: seatsPerRow }, (_, index) => ({
          sectionId: section.id,
          row,
          number: index + 1,
        })),
      ),
    );
  }
  return venue.id;
}

// 공연에 좌석 등급을 넣고, 등급마다 고른 구역·열의 좌석에 그 등급을 지정한다.
// rows를 주지 않은 구역은 그 구역의 모든 열이다.
async function insertSeatGrades({
  showId,
  grades,
}: {
  showId: number;
  grades: {
    name: string;
    price: number;
    seats: { section: string; rows?: string[] }[];
  }[];
}): Promise<void> {
  const [show] = await db
    .select({ venueId: shows.venueId })
    .from(shows)
    .where(eq(shows.id, showId));
  if (!show) {
    throw new Error('공연이 없습니다.');
  }
  for (const { name, price, seats: seatInputs } of grades) {
    const [grade] = await db
      .insert(seatGrades)
      .values({ showId, name, price })
      .returning({ id: seatGrades.id });
    if (!grade) {
      throw new Error('좌석 등급을 넣지 못했습니다.');
    }
    for (const { section, rows } of seatInputs) {
      const gradeSeats = await db
        .select({ id: seats.id })
        .from(seats)
        .innerJoin(sections, eq(sections.id, seats.sectionId))
        .where(
          and(
            eq(sections.venueId, show.venueId),
            eq(sections.name, section),
            rows ? inArray(seats.row, rows) : undefined,
          ),
        );
      await db.insert(seatGradeAssignments).values(
        gradeSeats.map((seat) => ({
          showId,
          seatId: seat.id,
          seatGradeId: grade.id,
        })),
      );
    }
  }
}

beforeAll(() => {
  vi.stubEnv('DATABASE_URL', inject('databaseUrl'));
  vi.stubEnv('SHOW_IMAGE_BASE_URL', SHOW_IMAGE_BASE_URL);
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await db.$client.end();
});

beforeEach(async () => {
  await db.execute(
    'TRUNCATE seat_grade_assignments, seat_grades, show_detail_images, performance_seats, performances, shows, seats, sections, venues RESTART IDENTITY CASCADE',
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

describe('GET /shows', () => {
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
      posterPath: 'posters/show-01.png',
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
          posterUrl: 'https://images.example.com/openrun/posters/show-01.png',
        },
      ],
      page: 1,
      size: 20,
      totalCount: 1,
      totalPages: 1,
    });
  });

  it('sort가 newest이면 등록 일시가 늦은 순으로, 같으면 나중에 등록한(id가 큰) 순으로 정렬한다', async () => {
    const venueId = await insertVenue('예술의전당');
    await insertShow({
      venueId,
      title: '먼저 등록',
      createdAt: '2026-01-01T00:00:00Z',
      performanceStarts: ['2026-03-01T10:00:00Z'],
    });
    await insertShow({
      venueId,
      title: '같은 시각 A',
      createdAt: '2026-01-05T00:00:00Z',
      performanceStarts: ['2026-05-01T10:00:00Z'],
    });
    await insertShow({
      venueId,
      title: '같은 시각 B',
      createdAt: '2026-01-05T00:00:00Z',
      performanceStarts: ['2026-04-01T10:00:00Z'],
    });
    await insertShow({
      venueId,
      title: '나중에 등록',
      createdAt: '2026-01-10T00:00:00Z',
      performanceStarts: ['2026-06-01T10:00:00Z'],
    });

    const response = await request(app.getHttpServer()).get(
      '/shows?sort=newest',
    );

    expect(
      response.body.items.map((item: { title: string }) => item.title),
    ).toEqual(['나중에 등록', '같은 시각 B', '같은 시각 A', '먼저 등록']);
  });

  it('sort가 start_date이면 기본 정렬과 같다', async () => {
    const venueId = await insertVenue('예술의전당');
    await insertShow({
      venueId,
      title: '늦게 시작',
      createdAt: '2026-01-01T00:00:00Z',
      performanceStarts: ['2026-05-01T10:00:00Z'],
    });
    await insertShow({
      venueId,
      title: '먼저 시작',
      createdAt: '2026-01-10T00:00:00Z',
      performanceStarts: ['2026-03-01T10:00:00Z'],
    });

    const response = await request(app.getHttpServer()).get(
      '/shows?sort=start_date',
    );

    expect(
      response.body.items.map((item: { title: string }) => item.title),
    ).toEqual(['먼저 시작', '늦게 시작']);
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

  describe('페이지', () => {
    // 3월 1일부터 하루에 하나씩 시작하는 공연 12개. 제목은 `공연 1` ~ `공연 12`이고 정렬 순서와 같다.
    async function insertTwelveShows() {
      const venueId = await insertVenue('예술의전당');
      for (let day = 1; day <= 12; day += 1) {
        await insertShow({
          venueId,
          title: `공연 ${day}`,
          performanceStarts: [
            `2026-03-${String(day).padStart(2, '0')}T10:00:00Z`,
          ],
        });
      }
    }

    it('page와 size로 자른 항목과 전체 개수, 전체 페이지 수를 돌려준다', async () => {
      await insertTwelveShows();

      const response = await request(app.getHttpServer()).get(
        '/shows?page=2&size=5',
      );

      expect(response.status).toBe(200);
      expect(
        response.body.items.map((item: { title: string }) => item.title),
      ).toEqual(['공연 6', '공연 7', '공연 8', '공연 9', '공연 10']);
      expect(response.body).toMatchObject({
        page: 2,
        size: 5,
        totalCount: 12,
        totalPages: 3,
      });
    });

    it('마지막 페이지는 남은 항목만 담는다', async () => {
      await insertTwelveShows();

      const response = await request(app.getHttpServer()).get(
        '/shows?page=3&size=5',
      );

      expect(
        response.body.items.map((item: { title: string }) => item.title),
      ).toEqual(['공연 11', '공연 12']);
    });

    it('마지막 페이지를 넘는 요청은 오류 없이 빈 항목과 전체 페이지 수를 돌려준다', async () => {
      await insertTwelveShows();

      const response = await request(app.getHttpServer()).get(
        '/shows?page=4&size=5',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [],
        page: 4,
        size: 5,
        totalCount: 12,
        totalPages: 3,
      });
    });

    it('잘못된 쿼리 값은 필드별 오류를 담은 400 Problem Details로 응답한다', async () => {
      const response = await request(app.getHttpServer()).get(
        '/shows?page=abc',
      );

      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toMatch(
        /^application\/problem\+json/,
      );
      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: '요청 값이 올바르지 않습니다.',
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'page', detail: '1 이상의 정수여야 합니다.' }],
      });
    });
  });

  describe('제목 검색', () => {
    // 제목마다 공연을 하나씩, 넣는 순서대로 첫 회차 일시가 이르게 넣는다.
    async function insertShowsTitled(titles: string[]) {
      const venueId = await insertVenue('예술의전당');
      for (const [index, title] of titles.entries()) {
        await insertShow({
          venueId,
          title,
          performanceStarts: [
            `2026-03-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
          ],
        });
      }
    }

    async function searchTitles(q: string) {
      const response = await request(app.getHttpServer())
        .get('/shows')
        .query({ q });
      return {
        status: response.status,
        titles: response.body.items?.map(
          (item: { title: string }) => item.title,
        ),
        totalCount: response.body.totalCount,
      };
    }

    it('제목의 일부와 대소문자를 구분하지 않고 맞는 공연만 결과와 전체 개수에 담는다', async () => {
      await insertShowsTitled([
        'Hamilton',
        '뮤지컬 해밀턴',
        'HAMLET',
        '오페라의 유령',
      ]);

      expect(await searchTitles('haM')).toEqual({
        status: 200,
        titles: ['Hamilton', 'HAMLET'],
        totalCount: 2,
      });
      expect(await searchTitles('해밀')).toMatchObject({
        titles: ['뮤지컬 해밀턴'],
      });
    });

    it.each([
      // 이스케이프하지 않으면 %는 아무 글자열, _는 아무 한 글자, \는 다음 글자를 그대로 찾는 뜻이 된다.
      { char: '%', q: '100%', expected: ['100% 라이브'] },
      { char: '_', q: 'a_b', expected: ['a_b 쇼'] },
      { char: '\\', q: 'c\\d', expected: ['c\\d 쇼'] },
    ])('$char 글자를 그대로 찾는다', async ({ q, expected }) => {
      await insertShowsTitled([
        '100% 라이브',
        '1000 라이브',
        'a_b 쇼',
        'axb 쇼',
        'c\\d 쇼',
        'cd 쇼',
      ]);

      expect(await searchTitles(q)).toMatchObject({ titles: expected });
    });

    it('앞뒤 공백을 지우고 찾는다', async () => {
      await insertShowsTitled(['달빛 정원', '햇빛 정원']);

      expect(await searchTitles('  달빛 ')).toMatchObject({
        titles: ['달빛 정원'],
      });
    });

    it.each([
      { name: '빈 값', q: '' },
      { name: '공백뿐인 값', q: '   ' },
    ])('$name: 검색하지 않고 모든 공연을 돌려준다', async ({ q }) => {
      await insertShowsTitled(['달빛 정원', '햇빛 정원']);

      expect(await searchTitles(q)).toEqual({
        status: 200,
        titles: ['달빛 정원', '햇빛 정원'],
        totalCount: 2,
      });
    });
  });

  describe('장르와 판매 상태 필터', () => {
    // 넣는 순서대로 첫 회차 일시가 이르게 넣는다. 기본 현재 시각(2026-02-01) 기준으로
    // 판매 오픈 일시를 주지 않은 회차는 판매 중이고, 2026-02-10에 여는 회차는 판매 예정이다.
    async function insertShows(
      inputs: { title: string; genre: Genre; status: 'on_sale' | 'upcoming' }[],
    ) {
      const venueId = await insertVenue('예술의전당');
      for (const [index, { title, genre, status }] of inputs.entries()) {
        await insertShow({
          venueId,
          title,
          genre,
          performances: [
            {
              startsAt: `2026-03-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
              salesOpenAt:
                status === 'upcoming' ? '2026-02-10T05:00:00Z' : undefined,
            },
          ],
        });
      }
    }

    async function filterTitles(query: string) {
      const response = await request(app.getHttpServer()).get(
        `/shows?${query}`,
      );
      return {
        status: response.status,
        titles: response.body.items?.map(
          (item: { title: string }) => item.title,
        ),
        totalCount: response.body.totalCount,
      };
    }

    beforeEach(async () => {
      await insertShows([
        { title: '뮤지컬 판매 중', genre: 'musical', status: 'on_sale' },
        { title: '연극 판매 중', genre: 'play', status: 'on_sale' },
        { title: '콘서트 판매 예정', genre: 'concert', status: 'upcoming' },
        { title: '뮤지컬 판매 예정', genre: 'musical', status: 'upcoming' },
      ]);
    });

    it('genre 하나로 그 장르의 공연만 결과와 전체 개수에 담는다', async () => {
      expect(await filterTitles('genre=musical')).toEqual({
        status: 200,
        titles: ['뮤지컬 판매 중', '뮤지컬 판매 예정'],
        totalCount: 2,
      });
    });

    it('genre를 여러 번 보내면 그중 하나에 맞는 공연을 담는다', async () => {
      expect(await filterTitles('genre=play&genre=concert')).toEqual({
        status: 200,
        titles: ['연극 판매 중', '콘서트 판매 예정'],
        totalCount: 2,
      });
    });

    it.each([
      {
        salesStatus: 'on_sale',
        titles: ['뮤지컬 판매 중', '연극 판매 중'],
      },
      {
        salesStatus: 'upcoming',
        titles: ['콘서트 판매 예정', '뮤지컬 판매 예정'],
      },
    ])(
      'status가 $salesStatus이면 그 공연 판매 상태의 공연만 담는다',
      async ({ salesStatus, titles }) => {
        expect(await filterTitles(`status=${salesStatus}`)).toEqual({
          status: 200,
          titles,
          totalCount: 2,
        });
      },
    );

    it('status를 둘 다 보내면 판매 중과 판매 예정 공연을 모두 담는다', async () => {
      expect(
        await filterTitles('status=on_sale&status=upcoming'),
      ).toMatchObject({ totalCount: 4 });
    });

    it('장르와 판매 상태를 함께 보내면 둘 다 맞는 공연만 담는다', async () => {
      expect(
        await filterTitles('genre=musical&genre=concert&status=upcoming'),
      ).toEqual({
        status: 200,
        titles: ['콘서트 판매 예정', '뮤지컬 판매 예정'],
        totalCount: 2,
      });
    });

    it('검색어와 함께 보내면 검색 결과 안에서 거른다', async () => {
      expect(
        await filterTitles(`q=${encodeURIComponent('판매 중')}&genre=musical`),
      ).toMatchObject({ titles: ['뮤지컬 판매 중'], totalCount: 1 });
    });

    it.each([
      {
        query: 'genre=opera',
        field: 'genre.0',
        detail:
          'musical, play, concert, classical_dance, kids_family 중 하나여야 합니다.',
      },
      // 판매 종료 공연은 목록에 없으므로 판매 상태 선택지가 아니다.
      {
        query: 'status=on_sale&status=ended',
        field: 'status.1',
        detail: 'on_sale, upcoming 중 하나여야 합니다.',
      },
    ])(
      '$query: 모르는 값은 400으로 응답한다',
      async ({ query, field, detail }) => {
        const response = await request(app.getHttpServer()).get(
          `/shows?${query}`,
        );

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual([{ field, detail }]);
      },
    );
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

describe('GET /shows/:id', () => {
  it('공연 정보, 공연장, 공연 기간, 공연 판매 상태, 회차 목록을 담는다', async () => {
    const venueId = await insertVenue('샤롯데씨어터');
    const showId = await insertShow({
      venueId,
      title: '달빛 정원',
      genre: 'play',
      posterPath: 'posters/show-01.png',
      minAge: 13,
      runningMinutes: 120,
      description: '달빛 아래 정원에서 벌어지는 이야기',
      // 넣는 순서와 상관없이 시작 일시 순으로 담는다.
      performanceStarts: ['2026-03-10T10:30:00Z', '2026-03-01T05:00:00Z'],
    });

    const response = await request(app.getHttpServer()).get(`/shows/${showId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: showId,
      title: '달빛 정원',
      genre: 'play',
      minAge: 13,
      runningMinutes: 120,
      description: '달빛 아래 정원에서 벌어지는 이야기',
      posterUrl: 'https://images.example.com/openrun/posters/show-01.png',
      venue: { id: venueId, name: '샤롯데씨어터' },
      period: {
        start: '2026-03-01T05:00:00.000Z',
        end: '2026-03-10T10:30:00.000Z',
      },
      salesStatus: 'on_sale',
      salesOpenAt: null,
      detailImages: [],
      seatGrades: [],
      performances: [
        {
          id: 2,
          startsAt: '2026-03-01T05:00:00.000Z',
          salesStatus: 'on_sale',
          remainingSeats: VENUE_SEAT_COUNT,
          totalSeats: VENUE_SEAT_COUNT,
          isAlmostSoldOut: false,
        },
        {
          id: 1,
          startsAt: '2026-03-10T10:30:00.000Z',
          salesStatus: 'on_sale',
          remainingSeats: VENUE_SEAT_COUNT,
          totalSeats: VENUE_SEAT_COUNT,
          isAlmostSoldOut: false,
        },
      ],
    });
  });

  it('상세 이미지를 순서대로 완전한 URL로 담는다', async () => {
    const venueId = await insertVenue('샤롯데씨어터');
    const showId = await insertShow({
      venueId,
      title: '달빛 정원',
      performanceStarts: ['2026-03-01T05:00:00Z'],
      // 넣는 순서와 상관없이 position 순으로 담는다.
      detailImages: [
        { position: 2, path: 'details/show-01-2.png' },
        { position: 1, path: 'details/show-01-1.png' },
      ],
    });

    const response = await request(app.getHttpServer()).get(`/shows/${showId}`);

    expect(response.body.detailImages).toEqual([
      { url: 'https://images.example.com/openrun/details/show-01-1.png' },
      { url: 'https://images.example.com/openrun/details/show-01-2.png' },
    ]);
  });

  describe('좌석 등급', () => {
    // 앞 구역 두 개는 두 열, 뒤 구역은 한 열이다.
    const venueSections: SectionInput[] = [
      { name: 'A구역', rows: ['A', 'B'], seatsPerRow: 2 },
      { name: 'B구역', rows: ['A', 'B'], seatsPerRow: 2 },
      { name: 'C구역', rows: ['A'], seatsPerRow: 2 },
    ];

    it('가격이 높은 순으로, 등급마다 그 등급 좌석이 있는 구역 이름을 담는다', async () => {
      const venueId = await insertVenue('샤롯데씨어터', {
        sections: venueSections,
      });
      const showId = await insertShow({
        venueId,
        title: '달빛 정원',
        performanceStarts: ['2026-03-01T05:00:00Z'],
      });
      // 넣는 순서와 상관없이 가격이 높은 순으로 담는다.
      await insertSeatGrades({
        showId,
        grades: [
          { name: 'R석', price: 140_000, seats: [{ section: 'B구역' }] },
          { name: 'S석', price: 110_000, seats: [{ section: 'C구역' }] },
          { name: 'VIP석', price: 170_000, seats: [{ section: 'A구역' }] },
        ],
      });

      const response = await request(app.getHttpServer()).get(
        `/shows/${showId}`,
      );

      expect(response.body.seatGrades).toEqual([
        { name: 'VIP석', price: 170_000, sectionNames: ['A구역'] },
        { name: 'R석', price: 140_000, sectionNames: ['B구역'] },
        { name: 'S석', price: 110_000, sectionNames: ['C구역'] },
      ]);
    });

    it('한 구역에 등급이 둘 이상 섞여 있으면 그 구역 이름을 각 등급에 담는다', async () => {
      const venueId = await insertVenue('샤롯데씨어터', {
        sections: venueSections,
      });
      const showId = await insertShow({
        venueId,
        title: '달빛 정원',
        performanceStarts: ['2026-03-01T05:00:00Z'],
      });
      // A구역은 앞 열이 VIP석, 뒤 열이 R석이다.
      await insertSeatGrades({
        showId,
        grades: [
          {
            name: 'VIP석',
            price: 170_000,
            seats: [{ section: 'A구역', rows: ['A'] }],
          },
          {
            name: 'R석',
            price: 140_000,
            seats: [
              { section: 'A구역', rows: ['B'] },
              { section: 'B구역' },
              { section: 'C구역' },
            ],
          },
        ],
      });

      const response = await request(app.getHttpServer()).get(
        `/shows/${showId}`,
      );

      // 구역 이름은 공연장에 구역을 둔 순서다.
      expect(response.body.seatGrades).toEqual([
        { name: 'VIP석', price: 170_000, sectionNames: ['A구역'] },
        {
          name: 'R석',
          price: 140_000,
          sectionNames: ['A구역', 'B구역', 'C구역'],
        },
      ]);
    });
  });

  describe('회차 목록', () => {
    // 기본 현재 시각(2026-02-01) 기준 회차들
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

    async function fetchPerformances(
      showId: number,
    ): Promise<Record<string, unknown>[]> {
      const response = await request(app.getHttpServer()).get(
        `/shows/${showId}`,
      );
      return response.body.performances;
    }

    it('시작한 회차는 빼고, 남은 회차마다 판매 상태와 남은 좌석을 담는다', async () => {
      const venueId = await insertVenue('예술의전당');
      const showId = await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [
          ended,
          // 시작한 뒤의 취소 회차도 더 고를 수 없어 뺀다.
          { startsAt: '2026-01-25T10:00:00Z', isCancelled: true },
          onSale,
          upcoming,
          cancelled,
          soldOut,
        ],
      });

      expect(await fetchPerformances(showId)).toEqual([
        expect.objectContaining({
          startsAt: '2026-03-01T10:00:00.000Z',
          salesStatus: 'upcoming',
        }),
        expect.objectContaining({
          startsAt: '2026-03-02T10:00:00.000Z',
          salesStatus: 'cancelled',
        }),
        expect.objectContaining({
          startsAt: '2026-03-03T10:00:00.000Z',
          salesStatus: 'sold_out',
          remainingSeats: 0,
          totalSeats: VENUE_SEAT_COUNT,
        }),
        expect.objectContaining({
          startsAt: '2026-03-05T10:00:00.000Z',
          salesStatus: 'on_sale',
          remainingSeats: VENUE_SEAT_COUNT,
          totalSeats: VENUE_SEAT_COUNT,
        }),
      ]);
    });

    it('남은 회차 좌석이 0이어도 판매 오픈 전이면 매진이 아니라 판매 예정이다', async () => {
      const venueId = await insertVenue('예술의전당');
      const showId = await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [{ ...upcoming, soldSeats: VENUE_SEAT_COUNT }],
      });

      expect(await fetchPerformances(showId)).toEqual([
        expect.objectContaining({ salesStatus: 'upcoming', remainingSeats: 0 }),
      ]);
    });

    it('회차 시작 정각이면 판매 종료라 빠지고, 직전이면 담는다', async () => {
      const venueId = await insertVenue('예술의전당');
      const showId = await insertShow({
        venueId,
        title: '달빛 정원',
        performanceStarts: ['2026-03-01T10:00:00Z', '2026-03-02T10:00:00Z'],
      });
      now = new Date('2026-03-01T10:00:00Z');

      expect(await fetchPerformances(showId)).toEqual([
        expect.objectContaining({ startsAt: '2026-03-02T10:00:00.000Z' }),
      ]);

      now = new Date(new Date('2026-03-01T10:00:00Z').getTime() - 1);

      expect(await fetchPerformances(showId)).toHaveLength(2);
    });

    // 공연장 좌석이 20석이므로 2석(10%)이 경계다.
    it.each([
      {
        name: '남은 좌석이 10%를 넘으면 아니다',
        soldSeats: 17,
        expected: false,
      },
      {
        name: '남은 좌석이 10%면 매진 임박이다',
        soldSeats: 18,
        expected: true,
      },
      {
        name: '남은 좌석이 1석이면 매진 임박이다',
        soldSeats: 19,
        expected: true,
      },
      { name: '매진이면 아니다', soldSeats: 20, expected: false },
    ])('판매 중 회차의 매진 임박: $name', async ({ soldSeats, expected }) => {
      const venueId = await insertVenue('예술의전당');
      const showId = await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [{ ...onSale, soldSeats }],
      });

      expect(await fetchPerformances(showId)).toEqual([
        expect.objectContaining({
          remainingSeats: VENUE_SEAT_COUNT - soldSeats,
          isAlmostSoldOut: expected,
        }),
      ]);
    });

    it('판매 예정 회차는 남은 좌석이 10% 이하여도 매진 임박이 아니다', async () => {
      const venueId = await insertVenue('예술의전당');
      const showId = await insertShow({
        venueId,
        title: '달빛 정원',
        performances: [{ ...upcoming, soldSeats: 19 }],
      });

      expect(await fetchPerformances(showId)).toEqual([
        expect.objectContaining({ isAlmostSoldOut: false }),
      ]);
    });

    it('모든 회차가 끝난 공연은 판매 종료이고 회차 목록이 비어 있다', async () => {
      const venueId = await insertVenue('예술의전당');
      const showId = await insertShow({
        venueId,
        title: '끝난 공연',
        performances: [ended],
      });

      const response = await request(app.getHttpServer()).get(
        `/shows/${showId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        salesStatus: 'ended',
        performances: [],
      });
    });
  });

  describe('없는 공연', () => {
    it.each([
      { name: '없는 id', path: '/shows/999' },
      { name: '정수가 아닌 id', path: '/shows/abc' },
      { name: '소수 id', path: '/shows/1.5' },
      { name: 'integer 범위를 넘는 id', path: '/shows/2147483648' },
    ])('$name는 404 Problem Details로 응답한다', async ({ path }) => {
      const response = await request(app.getHttpServer()).get(path);

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(
        /^application\/problem\+json/,
      );
      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: '공연을 찾을 수 없습니다.',
        code: 'SHOW_NOT_FOUND',
      });
    });

    it('회차가 없는 공연은 목록처럼 없는 공연으로 본다', async () => {
      const venueId = await insertVenue('예술의전당');
      const showId = await insertShow({ venueId, title: '회차 없음' });

      const response = await request(app.getHttpServer()).get(
        `/shows/${showId}`,
      );

      expect(response.status).toBe(404);
    });
  });
});
