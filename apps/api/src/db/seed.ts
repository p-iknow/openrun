import { fakerKO as faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readEnv } from '../config/env.js';
import { GENRES, type Genre, performances, shows } from './schema/shows.js';
import { venues } from './schema/venues.js';

// 개발용 시드다. 매번 비우고 같은 id부터 다시 넣는다.
// Faker 시드 값을 고정하고 Faker를 부르는 순서가 실행 시각과 무관하므로, 공연 구성(제목, 장르, 공연장, 회차 수)은 늘 같다.
// 날짜만 실행 시각 기준 상대값이라, 몇 주가 지나도 판매 예정부터 판매 종료까지 모든 경우가 남는다.
const FAKER_SEED = 20261109;
const SHOW_COUNT = 20;

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
// 한국은 서머타임이 없어 UTC+9로 고정이다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const VENUE_NAMES = ['낙산 소극장', '한강 아트홀', '서울 그랜드 씨어터'];

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
}

// 앞의 공연 4개는 모든 판매 상태가 나오도록 고정한다. 매진과 매진 임박은 회차 좌석이 생기는 뒤 티켓에서 더한다.
const FIXED_SCENARIOS: Scenario[] = [
  // 판매 예정
  { salesOpenDay: 3, pastCount: 0, firstFutureDay: 10, cancel: 'none' },
  // 판매 중. 지난 회차(판매 종료)와 취소된 회차가 섞여 있다.
  { salesOpenDay: -10, pastCount: 1, firstFutureDay: 1, cancel: 'one-future' },
  // 남은 회차가 모두 취소됐다(회차 취소).
  { salesOpenDay: -10, pastCount: 0, firstFutureDay: 2, cancel: 'all-future' },
  // 모든 회차가 끝났다(판매 종료).
  { salesOpenDay: -40, pastCount: 'all', firstFutureDay: 1, cancel: 'none' },
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
    };
  }
  const salesOpenDay = faker.number.int({ min: 1, max: 7 });
  return {
    salesOpenDay,
    pastCount: 0,
    firstFutureDay: salesOpenDay + faker.number.int({ min: 5, max: 10 }),
    cancel: 'none',
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
        venueIndex: faker.number.int({ min: 0, max: VENUE_NAMES.length - 1 }),
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
      performances: buildPerformances({
        scenario,
        count: performanceCount,
        today,
      }),
    };
  });
}

faker.seed(FAKER_SEED);
// 오늘 KST 0시의 UTC 시각
const today =
  Math.floor((Date.now() + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS;
const seedShows = buildShows(today);

const db = drizzle(readEnv().databaseUrl);

try {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`TRUNCATE ${performances}, ${shows}, ${venues} RESTART IDENTITY`,
    );
    const venueRows = await tx
      .insert(venues)
      .values(VENUE_NAMES.map((name) => ({ name })))
      .returning({ id: venues.id });

    for (const { show, performances: showPerformances } of seedShows) {
      const { venueIndex, ...values } = show;
      const venue = venueRows[venueIndex];
      if (!venue) {
        throw new Error(`공연장 순번이 범위를 벗어났습니다: ${venueIndex}`);
      }
      const [inserted] = await tx
        .insert(shows)
        .values({ ...values, venueId: venue.id })
        .returning({ id: shows.id });
      if (!inserted) {
        throw new Error(`공연을 넣지 못했습니다: ${show.title}`);
      }
      await tx
        .insert(performances)
        .values(showPerformances.map((p) => ({ ...p, showId: inserted.id })));
    }
  });
  const performanceCount = seedShows.reduce(
    (sum, { performances: list }) => sum + list.length,
    0,
  );
  console.log(
    `공연장 ${VENUE_NAMES.length}곳, 공연 ${seedShows.length}개, 회차 ${performanceCount}개를 넣었습니다.`,
  );
} finally {
  await db.$client.end();
}
