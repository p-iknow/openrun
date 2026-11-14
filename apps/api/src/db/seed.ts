import { fakerKO as faker } from '@faker-js/faker';
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgInsertValue, PgTable } from 'drizzle-orm/pg-core';
import { readDatabaseUrl } from '../config/env.js';
import {
  GENRES,
  performanceSeats,
  performances,
  seatGradeAssignments,
  seatGrades,
  showDetailImages,
  shows,
  type Genre,
} from './schema/shows.js';
import { seats, sections, venues } from './schema/venues.js';
import { renderDetailImages } from './seed-detail-image.js';
import { renderPoster } from './seed-poster.js';
import { buildShowDescription, SEED_SHOW_CONTENTS } from './seed-shows.js';

// 개발용 시드다. 매번 비우고 같은 id부터 다시 넣는다.
// 공연의 제목, 장르, 관람 연령, 러닝타임, 소개는 seed-shows.ts에 직접 쓴 내용이다.
// Faker 시드 값을 고정하고 Faker를 부르는 순서가 실행 시각과 무관하므로, 공연장과 회차 수도 늘 같다.
// 날짜만 실행 시각 기준 상대값이라, 몇 주가 지나도 판매 예정부터 판매 종료까지, 매진 회차와 매진 임박 회차까지 모든 경우가 남는다.
const FAKER_SEED = 20261109;

// 공연 이미지(포스터, 상세 이미지)는 스토어의 정적 파일 폴더에 쓰고, 스토어가 /show-images/<저장소 안 경로>로 내보낸다(SHOW_IMAGE_BASE_URL).
// 이 폴더는 git에 올리지 않고 시드를 돌릴 때마다 비우고 다시 만든다. 1.7에서 MinIO 업로드로 바꾼다.
const SHOW_IMAGE_DIR = new URL(
  '../../../store/public/show-images/',
  import.meta.url,
);

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
function buildSections({
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
    sections: buildSections({ count: 2, rows: 5, seatsPerRow: 10 }),
  },
  // 300석
  {
    name: '한강 아트홀',
    sections: buildSections({ count: 3, rows: 10, seatsPerRow: 10 }),
  },
  // 600석
  {
    name: '서울 그랜드 씨어터',
    sections: buildSections({ count: 4, rows: 10, seatsPerRow: 15 }),
  },
];

// 장르마다 좌석 등급과 가격(원)이다. 비싼 등급부터 적는다. 실제 예매 서비스의 등급 이름(VIP석, R석, S석, A석)과 가격대를 따랐다.
// 등급은 공연마다 따로 만들므로, 같은 장르의 공연도 등급 행은 공연마다 있다.
const SEAT_GRADES_BY_GENRE: Record<Genre, { name: string; price: number }[]> = {
  musical: [
    { name: 'VIP석', price: 170_000 },
    { name: 'R석', price: 140_000 },
    { name: 'S석', price: 110_000 },
    { name: 'A석', price: 80_000 },
  ],
  play: [
    { name: 'R석', price: 66_000 },
    { name: 'S석', price: 55_000 },
  ],
  concert: [
    { name: 'VIP석', price: 154_000 },
    { name: 'R석', price: 132_000 },
    { name: 'S석', price: 110_000 },
  ],
  classical_dance: [
    { name: 'R석', price: 120_000 },
    { name: 'S석', price: 90_000 },
    { name: 'A석', price: 60_000 },
  ],
  kids_family: [
    { name: 'R석', price: 50_000 },
    { name: 'S석', price: 40_000 },
  ],
};

// 좌석 하나의 등급 순번(0이 가장 비싼 등급)이다. 구역을 A구역부터 무대에서 먼 쪽으로 이어 놓은 것으로 보고,
// 공연장 전체의 열을 앞에서부터 등급 수만큼 나눠 앞 열일수록 비싼 등급을 준다.
// 나누는 경계가 구역 중간에 걸리면 그 구역은 앞 열과 뒤 열의 등급이 갈린다(예: 낙산 소극장의 뮤지컬은 A구역이 VIP석과 R석으로 갈린다).
// 공연장 전체 열 수(최소 10)가 등급 수(최대 4)보다 많아 모든 등급에 좌석이 있다.
function getSeatGradeIndex({
  rowPosition,
  totalRows,
  gradeCount,
}: {
  rowPosition: number;
  totalRows: number;
  gradeCount: number;
}): number {
  return Math.floor((rowPosition * gradeCount) / totalRows);
}

// 회차 좌석과 좌석 등급 지정을 한 번에 넣는 행 수. 한 쿼리의 파라미터는 65535개까지라 컬럼 3개 기준으로 넉넉히 나눈다.
const INSERT_CHUNK = 10_000;

// 행이 많아 한 쿼리에 다 넣을 수 없는 테이블에 INSERT_CHUNK 행씩 나눠 넣는다.
async function insertInChunks<T extends PgTable>({
  db,
  table,
  rows,
}: {
  db: Pick<NodePgDatabase, 'insert'>;
  table: T;
  rows: PgInsertValue<T>[];
}): Promise<void> {
  for (let start = 0; start < rows.length; start += INSERT_CHUNK) {
    await db.insert(table).values(rows.slice(start, start + INSERT_CHUNK));
  }
}

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

function pickRandomScenario(): Scenario {
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

function buildKstDate({
  today,
  day,
  hour,
  minute,
}: {
  today: number;
  day: number;
  hour: number;
  minute: number;
}): Date {
  return new Date(today + day * DAY_MS + (hour * 60 + minute) * MINUTE_MS);
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
  const salesOpenAt = buildKstDate({
    today,
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
      startsAt: buildKstDate({ today, day, ...time }),
      salesOpenAt,
      isCancelled:
        index === futureIndexToCancel ||
        (scenario.cancel === 'all-future' && isFuture),
    };
  });
}

function countSeats(layout: { sections: SectionLayout[] }): number {
  return layout.sections.reduce(
    (sum, { rows, seatsPerRow }) => sum + rows * seatsPerRow,
    0,
  );
}

// 회차마다 판매됨으로 둘 좌석 수를 정한다. 판매 예정이나 취소된 회차는 판매된 좌석이 없다.
function buildSoldCounts({
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
  const pickSomeSoldCount = () =>
    Math.floor(seatCount * faker.number.float({ min: 0, max: 0.7 }));
  let almostSoldOutLeft = sales === 'one-almost-sold-out';

  return list.map(({ startsAt, salesOpenAt, isCancelled }) => {
    if (isCancelled || now < salesOpenAt.getTime()) {
      return 0;
    }
    if (startsAt.getTime() <= now) {
      return pickSomeSoldCount();
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
    return pickSomeSoldCount();
  });
}

function buildShows(today: number) {
  return SEED_SHOW_CONTENTS.map((content, index) => {
    const scenario = FIXED_SCENARIOS[index] ?? pickRandomScenario();
    const performanceCount = faker.number.int({ min: 3, max: 15 });
    return {
      content,
      show: {
        venueIndex: faker.number.int({
          min: 0,
          max: VENUE_LAYOUTS.length - 1,
        }),
        title: content.title,
        genre: content.genre,
        minAge: content.minAge,
        runningMinutes: content.runningMinutes,
        description: buildShowDescription(content),
        createdAt: buildKstDate({
          today,
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
    const seatCount = countSeats(layout);
    const soldCounts = buildSoldCounts({
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
function formatPosterPeriod(list: { startsAt: Date }[]): string {
  const times = list.map(({ startsAt }) => startsAt.getTime());
  const formatKstDate = (time: number) =>
    new Date(time + KST_OFFSET_MS)
      .toISOString()
      .slice(0, 10)
      .replaceAll('-', '.');
  const start = formatKstDate(Math.min(...times));
  const end = formatKstDate(Math.max(...times));
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
      period: formatPosterPeriod(list),
      // 장르를 순번대로 돌려 붙이므로, 같은 장르 안에서 몇 번째인지로 색과 구도를 바꾼다.
      variant: Math.floor(index / GENRES.length),
    });
    const hash = createHash('sha256').update(png).digest('hex').slice(0, 8);
    return {
      path: `posters/show-${String(index + 1).padStart(2, '0')}-${hash}.png`,
      png,
    };
  }),
);
// 상세 이미지는 포스터와 같은 색으로 공연마다 세 장(소개, 관람 포인트, 예매·관람 안내)을 만든다. 경로의 해시는 포스터와 같은 이유로 넣는다.
const detailImages = await Promise.all(
  seedShows.map(async ({ content }, index) => {
    const images = await renderDetailImages({
      content,
      variant: Math.floor(index / GENRES.length),
    });
    return images.map((png, imageIndex) => {
      const hash = createHash('sha256').update(png).digest('hex').slice(0, 8);
      return {
        position: imageIndex + 1,
        path: `details/show-${String(index + 1).padStart(2, '0')}-${imageIndex + 1}-${hash}.png`,
        png,
      };
    });
  }),
);

await rm(SHOW_IMAGE_DIR, { recursive: true, force: true });
await Promise.all([
  mkdir(new URL('posters/', SHOW_IMAGE_DIR), { recursive: true }),
  mkdir(new URL('details/', SHOW_IMAGE_DIR), { recursive: true }),
]);
await Promise.all(
  [...posters, ...detailImages.flat()].map(({ path, png }) =>
    writeFile(new URL(path, SHOW_IMAGE_DIR), png),
  ),
);

const db = drizzle(readDatabaseUrl());

try {
  const performanceSeatCount = await db.transaction(async (tx) => {
    await tx.execute(
      sql`TRUNCATE ${seatGradeAssignments}, ${seatGrades}, ${showDetailImages}, ${performanceSeats}, ${performances}, ${shows}, ${seats}, ${sections}, ${venues} RESTART IDENTITY`,
    );

    // 공연장마다 좌석 목록. 회차 좌석은 이 목록의 좌석 수만큼 만들고, 좌석 등급은 공연장 전체에서 몇 번째 열인지(rowPosition)로 정한다.
    const venueSeats: {
      venueId: number;
      totalRows: number;
      seats: { id: number; sectionId: number; rowPosition: number }[];
    }[] = [];
    for (const layout of VENUE_LAYOUTS) {
      const [venue] = await tx
        .insert(venues)
        .values({ name: layout.name })
        .returning({ id: venues.id });
      if (!venue) {
        throw new Error(`공연장을 넣지 못했습니다: ${layout.name}`);
      }
      const venueSeatList: {
        id: number;
        sectionId: number;
        rowPosition: number;
      }[] = [];
      let rowOffset = 0;
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
          .returning({ id: seats.id, row: seats.row });
        venueSeatList.push(
          ...sectionSeats.map(({ id, row }) => ({
            id,
            sectionId: section.id,
            rowPosition: rowOffset + row.charCodeAt(0) - 'A'.charCodeAt(0),
          })),
        );
        rowOffset += rows;
      }
      venueSeats.push({
        venueId: venue.id,
        totalRows: rowOffset,
        seats: venueSeatList,
      });
    }

    const seatGradeAssignmentRows: (typeof seatGradeAssignments.$inferInsert)[] =
      [];
    // 구역 안에서 앞 열과 뒤 열의 등급이 갈리는 공연 수. 공연장과 등급 수에 따라 갈리지 않는 공연도 있어, 하나는 나오는지 끝에서 확인한다.
    let mixedSectionShowCount = 0;
    const performanceSeatRows: (typeof performanceSeats.$inferInsert)[] = [];
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
      await tx.insert(showDetailImages).values(
        (detailImages[index] ?? []).map(({ png: _png, ...image }) => ({
          ...image,
          showId: inserted.id,
        })),
      );
      const grades = await tx
        .insert(seatGrades)
        .values(
          SEAT_GRADES_BY_GENRE[show.genre].map((grade) => ({
            ...grade,
            showId: inserted.id,
          })),
        )
        .returning({ id: seatGrades.id });
      // 공연장의 모든 좌석에 등급을 하나씩 지정한다.
      const gradeIdsBySection = new Map<number, Set<number>>();
      seatGradeAssignmentRows.push(
        ...venue.seats.map(({ id, sectionId, rowPosition }) => {
          const grade =
            grades[
              getSeatGradeIndex({
                rowPosition,
                totalRows: venue.totalRows,
                gradeCount: grades.length,
              })
            ];
          if (!grade) {
            throw new Error(`좌석 등급을 고르지 못했습니다: ${show.title}`);
          }
          gradeIdsBySection.set(
            sectionId,
            (gradeIdsBySection.get(sectionId) ?? new Set()).add(grade.id),
          );
          return { showId: inserted.id, seatId: id, seatGradeId: grade.id };
        }),
      );
      if ([...gradeIdsBySection.values()].some((ids) => ids.size > 1)) {
        mixedSectionShowCount += 1;
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
          ...venue.seats.map(({ id: seatId }, index) => ({
            performanceId: insertedPerformance.id,
            seatId,
            isSold: soldSeatIndexes.has(index),
          })),
        );
      }
    }

    if (mixedSectionShowCount === 0) {
      throw new Error(
        '구역 안에서 등급이 갈리는 공연이 없습니다. 공연장 배치나 장르별 등급 수를 바꿔 하나는 나오게 하세요.',
      );
    }

    await insertInChunks({
      db: tx,
      table: seatGradeAssignments,
      rows: seatGradeAssignmentRows,
    });
    await insertInChunks({
      db: tx,
      table: performanceSeats,
      rows: performanceSeatRows,
    });
    return performanceSeatRows.length;
  });
  const performanceCount = seedShows.reduce(
    (sum, { performances: list }) => sum + list.length,
    0,
  );
  const seatCount = VENUE_LAYOUTS.reduce(
    (sum, layout) => sum + countSeats(layout),
    0,
  );
  console.log(
    `공연장 ${VENUE_LAYOUTS.length}곳(좌석 ${seatCount}석), 공연 ${seedShows.length}개, 회차 ${performanceCount}개, 회차 좌석 ${performanceSeatCount}개를 넣고 포스터 ${posters.length}장, 상세 이미지 ${detailImages.flat().length}장을 만들었습니다.`,
  );
} finally {
  await db.$client.end();
}
