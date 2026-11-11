import { fakerKO as faker } from '@faker-js/faker';
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readDatabaseUrl } from '../config/env.js';
import {
  GENRES,
  type Genre,
  performanceSeats,
  performances,
  shows,
} from './schema/shows.js';
import { seats, sections, venues } from './schema/venues.js';
import { renderPoster } from './seed-poster.js';

// 개발용 시드다. 매번 비우고 같은 id부터 다시 넣는다.
// Faker 시드 값을 고정하고 Faker를 부르는 순서가 실행 시각과 무관하므로, 공연 구성(제목, 장르, 공연장, 회차 수)은 늘 같다.
// 날짜만 실행 시각 기준 상대값이라, 몇 주가 지나도 판매 예정부터 판매 종료까지, 매진 회차와 매진 임박 회차까지 모든 경우가 남는다.
const FAKER_SEED = 20261109;
const SHOW_COUNT = 20;

// 포스터는 스토어의 정적 파일 폴더에 쓰고, 스토어가 /posters/<포스터 경로>로 내보낸다(POSTER_BASE_URL).
// 이 폴더는 git에 올리지 않고 시드를 돌릴 때마다 비우고 다시 만든다. 1.7에서 MinIO 업로드로 바꾼다.
const POSTER_DIR = new URL('../../../store/public/posters/', import.meta.url);

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
// 한국은 서머타임이 없어 UTC+9로 고정이다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 공연장마다 구역과 좌석 배치. 구역마다 열 수 × 열당 좌석 수만큼 좌석을 만든다.
interface SectionLayout {
  name: string;
  rows: number;
  seatsPerRow: number;
}

// 구역 이름은 A구역부터 붙이고, 구역마다 같은 열 수와 열당 좌석 수를 쓴다.
function sectionsOf({
  count,
  rows,
  seatsPerRow,
}: {
  count: number;
  rows: number;
  seatsPerRow: number;
}): SectionLayout[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `${String.fromCharCode('A'.charCodeAt(0) + index)}구역`,
    rows,
    seatsPerRow,
  }));
}

const VENUE_LAYOUTS: { name: string; sections: SectionLayout[] }[] = [
  // 100석
  {
    name: '낙산 소극장',
    sections: sectionsOf({ count: 2, rows: 5, seatsPerRow: 10 }),
  },
  // 300석
  {
    name: '한강 아트홀',
    sections: sectionsOf({ count: 3, rows: 10, seatsPerRow: 10 }),
  },
  // 600석
  {
    name: '서울 그랜드 씨어터',
    sections: sectionsOf({ count: 4, rows: 10, seatsPerRow: 15 }),
  },
];

// 회차 좌석을 한 번에 넣는 행 수. 한 쿼리의 파라미터는 65535개까지라 컬럼 3개 기준으로 넉넉히 나눈다.
const PERFORMANCE_SEAT_CHUNK = 10_000;

const TITLE_FIRST_WORDS = [
  '달빛',
  '겨울',
  '붉은',
  '푸른',
  '마지막',
  '작은',
  '한여름',
  '새벽',
  '오래된',
  '비밀의',
  '노란',
  '잃어버린',
];
const TITLE_SECOND_WORDS = [
  '정원',
  '기차',
  '편지',
  '등대',
  '왈츠',
  '서커스',
  '도서관',
  '골목',
  '항해',
  '초상',
  '여름밤',
  '숲',
];

// 회차 배치. 판매 상태는 저장하지 않으므로, 판매 오픈 일시와 시작 일시, 회차 취소로 각 상태가 나오게 한다.
// 일 단위 오프셋은 오늘(KST) 0시 기준이다. 지난 회차는 어제 이전, 남은 회차는 내일 이후에 둬서
// 시드를 하루 중 언제 돌려도 같은 상태가 나온다.
interface Scenario {
  salesOpenDay: number;
  // 'all'이면 모든 회차를 지난 회차로 둔다(판매 종료).
  pastCount: number | 'all';
  firstFutureDay: number;
  cancel: 'none' | 'one-future' | 'all-future';
  // 판매 중인 회차의 판매됨 배치. 판매 예정 회차와 취소된 회차는 늘 모두 판매 가능이다.
  // some: 회차마다 전체의 0~70%를 판매해 매진 임박이 나오지 않는다.
  // sold-out: 남은 회차의 회차 좌석을 모두 판매됨으로 둔다(매진).
  // one-almost-sold-out: 첫 남은 회차만 남은 좌석을 10% 이하로 두고 나머지는 some이다(매진 임박).
  sales: 'some' | 'sold-out' | 'one-almost-sold-out';
}

// 앞의 공연 6개는 모든 공연 판매 상태와, 매진 회차, 매진 임박 회차가 나오도록 고정한다.
const FIXED_SCENARIOS: Scenario[] = [
  // 판매 예정
  {
    salesOpenDay: 3,
    pastCount: 0,
    firstFutureDay: 10,
    cancel: 'none',
    sales: 'some',
  },
  // 판매 중. 지난 회차(판매 종료)와 취소된 회차가 섞여 있다.
  {
    salesOpenDay: -10,
    pastCount: 1,
    firstFutureDay: 1,
    cancel: 'one-future',
    sales: 'some',
  },
  // 남은 회차가 모두 취소됐다. 취소된 회차는 판매 종료라 공연도 판매 종료다.
  {
    salesOpenDay: -10,
    pastCount: 0,
    firstFutureDay: 2,
    cancel: 'all-future',
    sales: 'some',
  },
  // 모든 회차가 끝났다(판매 종료).
  {
    salesOpenDay: -40,
    pastCount: 'all',
    firstFutureDay: 1,
    cancel: 'none',
    sales: 'some',
  },
  // 남은 회차가 모두 매진이다. 판매 기간 안이라 공연은 판매 중이다.
  {
    salesOpenDay: -14,
    pastCount: 1,
    firstFutureDay: 2,
    cancel: 'one-future',
    sales: 'sold-out',
  },
  // 판매 중이고 남은 좌석이 10% 이하인 회차가 있다(매진 임박).
  {
    salesOpenDay: -7,
    pastCount: 0,
    firstFutureDay: 3,
    cancel: 'none',
    sales: 'one-almost-sold-out',
  },
];

function randomScenario(): Scenario {
  if (faker.datatype.boolean({ probability: 0.7 })) {
    return {
      salesOpenDay: -faker.number.int({ min: 3, max: 20 }),
      pastCount: faker.number.int({ min: 0, max: 2 }),
      firstFutureDay: faker.number.int({ min: 1, max: 7 }),
      cancel: faker.datatype.boolean({ probability: 0.2 })
        ? 'one-future'
        : 'none',
      sales: 'some',
    };
  }
  const salesOpenDay = faker.number.int({ min: 1, max: 7 });
  return {
    salesOpenDay,
    pastCount: 0,
    firstFutureDay: salesOpenDay + faker.number.int({ min: 5, max: 10 }),
    cancel: 'none',
    sales: 'some',
  };
}

function kstAt(
  today: number,
  { day, hour, minute }: { day: number; hour: number; minute: number },
): Date {
  return new Date(today + day * DAY_MS + (hour * 60 + minute) * MINUTE_MS);
}

function minAgeOf(genre: Genre): number {
  return genre === 'kids_family'
    ? faker.helpers.arrayElement([0, 4])
    : faker.helpers.arrayElement([0, 7, 8, 12, 15]);
}

function buildPerformances({
  scenario,
  count,
  today,
}: {
  scenario: Scenario;
  count: number;
  today: number;
}) {
  const gap = faker.number.int({ min: 1, max: 3 });
  const pastCount =
    scenario.pastCount === 'all' ? count : Math.min(scenario.pastCount, count);
  const futureCount = count - pastCount;
  const salesOpenAt = kstAt(today, {
    day: scenario.salesOpenDay,
    hour: 14,
    minute: 0,
  });

  const days = [
    ...Array.from({ length: pastCount }, (_, i) => -(pastCount - i) * gap),
    ...Array.from(
      { length: futureCount },
      (_, i) => scenario.firstFutureDay + i * gap,
    ),
  ];
  const futureIndexToCancel =
    scenario.cancel === 'one-future' && futureCount > 1
      ? pastCount + faker.number.int({ min: 0, max: futureCount - 1 })
      : -1;

  return days.map((day, index) => {
    const time = faker.helpers.arrayElement([
      { hour: 14, minute: 0 },
      { hour: 19, minute: 30 },
    ]);
    const isFuture = index >= pastCount;
    return {
      startsAt: kstAt(today, { day, ...time }),
      salesOpenAt,
      isCancelled:
        index === futureIndexToCancel ||
        (scenario.cancel === 'all-future' && isFuture),
    };
  });
}

function seatCountOf(layout: { sections: SectionLayout[] }): number {
  return layout.sections.reduce(
    (sum, { rows, seatsPerRow }) => sum + rows * seatsPerRow,
    0,
  );
}

// 회차마다 판매됨으로 둘 좌석 수를 정한다. 판매 예정이나 취소된 회차는 판매된 좌석이 없다.
function soldCountsOf({
  performances: list,
  sales,
  seatCount,
  now,
}: {
  performances: { startsAt: Date; salesOpenAt: Date; isCancelled: boolean }[];
  sales: Scenario['sales'];
  seatCount: number;
  now: number;
}): number[] {
  const some = () =>
    Math.floor(seatCount * faker.number.float({ min: 0, max: 0.7 }));
  let almostSoldOutLeft = sales === 'one-almost-sold-out';

  return list.map(({ startsAt, salesOpenAt, isCancelled }) => {
    if (isCancelled || now < salesOpenAt.getTime()) {
      return 0;
    }
    if (startsAt.getTime() <= now) {
      return some();
    }
    if (sales === 'sold-out') {
      return seatCount;
    }
    if (almostSoldOutLeft) {
      almostSoldOutLeft = false;
      // 남은 좌석을 1석 이상, 전체의 10% 이하로 둔다.
      return (
        seatCount -
        faker.number.int({ min: 1, max: Math.floor(seatCount / 10) })
      );
    }
    return some();
  });
}

function buildShows(today: number) {
  const titles = faker.helpers.uniqueArray(
    () =>
      `${faker.helpers.arrayElement(TITLE_FIRST_WORDS)} ${faker.helpers.arrayElement(TITLE_SECOND_WORDS)}`,
    SHOW_COUNT,
  );

  return titles.map((title, index) => {
    // 장르 필터에서 빈 장르가 없도록 돌아가며 붙인다.
    const genre = GENRES[index % GENRES.length] ?? 'musical';
    const scenario = FIXED_SCENARIOS[index] ?? randomScenario();
    const performanceCount = faker.number.int({ min: 3, max: 15 });
    return {
      show: {
        venueIndex: faker.number.int({
          min: 0,
          max: VENUE_LAYOUTS.length - 1,
        }),
        title,
        genre,
        minAge: minAgeOf(genre),
        runningMinutes: faker.number.int({ min: 6, max: 18 }) * 10,
        description: faker.lorem.paragraphs(2),
        createdAt: kstAt(today, {
          day: -faker.number.int({ min: 1, max: 60 }),
          hour: 10,
          minute: 0,
        }),
      },
      sales: scenario.sales,
      performances: buildPerformances({
        scenario,
        count: performanceCount,
        today,
      }),
    };
  });
}

// 공연 구성을 먼저 모두 만든 뒤 판매됨 배치를 정해, 회차 좌석이 공연 구성의 Faker 순서에 끼어들지 않게 한다.
function buildSeedShows(now: number) {
  const today =
    Math.floor((now + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS;
  return buildShows(today).map(({ sales, ...seedShow }) => {
    const layout = VENUE_LAYOUTS[seedShow.show.venueIndex];
    if (!layout) {
      throw new Error(
        `공연장 순번이 범위를 벗어났습니다: ${seedShow.show.venueIndex}`,
      );
    }
    const seatCount = seatCountOf(layout);
    const soldCounts = soldCountsOf({
      performances: seedShow.performances,
      sales,
      seatCount,
      now,
    });
    return {
      ...seedShow,
      performances: seedShow.performances.map((performance, index) => ({
        ...performance,
        // 공연장 좌석 목록 안의 순번이다. 판매된 좌석이 구역 곳곳에 흩어지도록 무작위로 고른다.
        soldSeatIndexes: new Set(
          faker.helpers.arrayElements(
            Array.from({ length: seatCount }, (_, i) => i),
            soldCounts[index] ?? 0,
          ),
        ),
      })),
    };
  });
}

faker.seed(FAKER_SEED);
const seedShows = buildSeedShows(Date.now());

// 포스터에 적을 공연 기간. 카드와 같이 첫 회차부터 마지막 회차까지의 한국 날짜다.
function posterPeriodOf(list: { startsAt: Date }[]): string {
  const times = list.map(({ startsAt }) => startsAt.getTime());
  const kstDate = (time: number) =>
    new Date(time + KST_OFFSET_MS)
      .toISOString()
      .slice(0, 10)
      .replaceAll('-', '.');
  const start = kstDate(Math.min(...times));
  const end = kstDate(Math.max(...times));
  return start === end ? start : `${start} – ${end}`;
}

// DB보다 먼저 쓴다. DB 트랜잭션이 실패해도 남는 것은 다음 시드가 지울 파일뿐이고,
// 반대 순서면 커밋된 공연의 포스터 경로가 없는 파일을 가리킬 수 있다.
// 포스터에 날짜가 들어가 시드를 돌린 날에 따라 내용이 바뀐다. 경로에 내용 해시를 넣어, 내용이 바뀌면 URL도 바뀌게 한다.
// 그래야 next/image가 URL 기준으로 캐시한 예전 포스터를 보여 주지 않는다.
const posters = await Promise.all(
  seedShows.map(async ({ show, performances: list }, index) => {
    const png = await renderPoster({
      title: show.title,
      genre: show.genre,
      venueName: VENUE_LAYOUTS[show.venueIndex]?.name ?? '',
      period: posterPeriodOf(list),
      // 장르를 순번대로 돌려 붙이므로, 같은 장르 안에서 몇 번째인지로 색과 구도를 바꾼다.
      variant: Math.floor(index / GENRES.length),
    });
    const hash = createHash('sha256').update(png).digest('hex').slice(0, 8);
    return {
      path: `show-${String(index + 1).padStart(2, '0')}-${hash}.png`,
      png,
    };
  }),
);
await rm(POSTER_DIR, { recursive: true, force: true });
await mkdir(POSTER_DIR, { recursive: true });
await Promise.all(
  posters.map(({ path, png }) => writeFile(new URL(path, POSTER_DIR), png)),
);

const db = drizzle(readDatabaseUrl());

try {
  const performanceSeatCount = await db.transaction(async (tx) => {
    await tx.execute(
      sql`TRUNCATE ${performanceSeats}, ${performances}, ${shows}, ${seats}, ${sections}, ${venues} RESTART IDENTITY`,
    );

    // 공연장마다 좌석 id 목록. 회차 좌석은 이 목록의 좌석 수만큼 만든다.
    const venueSeats: { venueId: number; seatIds: number[] }[] = [];
    for (const layout of VENUE_LAYOUTS) {
      const [venue] = await tx
        .insert(venues)
        .values({ name: layout.name })
        .returning({ id: venues.id });
      if (!venue) {
        throw new Error(`공연장을 넣지 못했습니다: ${layout.name}`);
      }
      const seatIds: number[] = [];
      for (const { name, rows, seatsPerRow } of layout.sections) {
        const [section] = await tx
          .insert(sections)
          .values({ venueId: venue.id, name })
          .returning({ id: sections.id });
        if (!section) {
          throw new Error(`구역을 넣지 못했습니다: ${name}`);
        }
        const sectionSeats = await tx
          .insert(seats)
          .values(
            Array.from({ length: rows }, (_, rowIndex) =>
              Array.from({ length: seatsPerRow }, (_, seatIndex) => ({
                sectionId: section.id,
                row: String.fromCharCode('A'.charCodeAt(0) + rowIndex),
                number: seatIndex + 1,
              })),
            ).flat(),
          )
          .returning({ id: seats.id });
        seatIds.push(...sectionSeats.map(({ id }) => id));
      }
      venueSeats.push({ venueId: venue.id, seatIds });
    }

    const performanceSeatRows: {
      performanceId: number;
      seatId: number;
      isSold: boolean;
    }[] = [];
    for (const [
      index,
      { show, performances: showPerformances },
    ] of seedShows.entries()) {
      const { venueIndex, ...values } = show;
      const poster = posters[index];
      if (!poster) {
        throw new Error(`포스터를 만들지 못했습니다: ${show.title}`);
      }
      const venue = venueSeats[venueIndex];
      if (!venue) {
        throw new Error(`공연장 순번이 범위를 벗어났습니다: ${venueIndex}`);
      }
      const [inserted] = await tx
        .insert(shows)
        .values({ ...values, venueId: venue.venueId, posterPath: poster.path })
        .returning({ id: shows.id });
      if (!inserted) {
        throw new Error(`공연을 넣지 못했습니다: ${show.title}`);
      }
      for (const { soldSeatIndexes, ...performance } of showPerformances) {
        const [insertedPerformance] = await tx
          .insert(performances)
          .values({ ...performance, showId: inserted.id })
          .returning({ id: performances.id });
        if (!insertedPerformance) {
          throw new Error(`회차를 넣지 못했습니다: ${show.title}`);
        }
        performanceSeatRows.push(
          ...venue.seatIds.map((seatId, index) => ({
            performanceId: insertedPerformance.id,
            seatId,
            isSold: soldSeatIndexes.has(index),
          })),
        );
      }
    }

    for (
      let start = 0;
      start < performanceSeatRows.length;
      start += PERFORMANCE_SEAT_CHUNK
    ) {
      await tx
        .insert(performanceSeats)
        .values(
          performanceSeatRows.slice(start, start + PERFORMANCE_SEAT_CHUNK),
        );
    }
    return performanceSeatRows.length;
  });
  const performanceCount = seedShows.reduce(
    (sum, { performances: list }) => sum + list.length,
    0,
  );
  const seatCount = VENUE_LAYOUTS.reduce(
    (sum, layout) => sum + seatCountOf(layout),
    0,
  );
  console.log(
    `공연장 ${VENUE_LAYOUTS.length}곳(좌석 ${seatCount}석), 공연 ${seedShows.length}개, 회차 ${performanceCount}개, 회차 좌석 ${performanceSeatCount}개를 넣고 포스터 ${posters.length}장을 만들었습니다.`,
  );
} finally {
  await db.$client.end();
}
