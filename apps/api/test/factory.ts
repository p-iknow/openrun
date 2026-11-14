import { eq } from 'drizzle-orm';
import * as Factory from 'factory.ts';
import {
  type Genre,
  performanceSeats,
  performances,
  seatGrades,
  showDetailImages,
  shows,
} from '../src/db/schema/shows.js';
import { seats, sections, venues } from '../src/db/schema/venues.js';
import { db } from './db.js';

// 테스트 데이터 팩토리. build()는 기본값을 채운 행을 DB에 넣고 id를 돌려준다.
// 테스트는 검증에 필요한 값만 넘긴다. 객체는 기본값과 합치고, 배열은 통째로 바꾼다.

// 공연장 하나의 좌석 수.
export const VENUE_SEAT_COUNT = 20;
// 회차 판매 오픈 일시의 기본값. 테스트의 기본 현재 시각(2026-02-01)보다 이르다.
const DEFAULT_SALES_OPEN_AT = '2026-01-01T01:00:00Z';
// 공연 등록 일시의 기본값. DB 기본값(now())은 테스트마다 달라지므로 늘 직접 넣는다.
const DEFAULT_CREATED_AT = '2025-12-01T00:00:00Z';

interface VenueInput {
  name: string;
}

interface PerformanceInput {
  startsAt: string;
  salesOpenAt: string;
  isCancelled: boolean;
  // 판매됨으로 둘 회차 좌석 수. 회차 좌석은 공연장의 좌석 수(VENUE_SEAT_COUNT)만큼 만든다.
  soldSeats: number;
}

interface ShowInput {
  venueId: number;
  title: string;
  genre: Genre;
  posterPath: string;
  createdAt: string;
  minAge: number;
  runningMinutes: number;
  description: string;
  // 회차마다 주지 않은 값은 performanceFactory의 기본값으로 채운다.
  performances: Partial<PerformanceInput>[];
  // 상세 이미지. position은 넣은 순서와 따로 준다.
  detailImages: { position: number; path: string }[];
  // 좌석 지정은 상세 응답에 나오지 않아 넣지 않는다.
  seatGrades: { name: string; price: number }[];
}

// 공연장과 구역 하나, 좌석 VENUE_SEAT_COUNT개를 넣고 공연장 id를 돌려준다.
export const venueFactory = Factory.Async.makeFactory<VenueInput>({
  name: '예술의전당',
}).transform(insertVenue);

// 기본 회차는 기본 현재 시각에 판매 중이다.
const performanceFactory = Factory.Sync.makeFactory<PerformanceInput>({
  startsAt: '2026-03-01T10:00:00Z',
  salesOpenAt: DEFAULT_SALES_OPEN_AT,
  isCancelled: false,
  soldSeats: 0,
});

// 공연과 회차, 상세 이미지, 좌석 등급을 넣고 공연 id를 돌려준다.
// 공연장을 주지 않으면 기본 공연장을 새로 넣는다. 기본 공연은 판매 중인 회차 하나를 갖는다.
export const showFactory = Factory.Async.makeFactory<ShowInput>({
  venueId: new Factory.Async.Derived<ShowInput, number>(() =>
    venueFactory.build(),
  ),
  title: '달빛 정원',
  genre: 'musical',
  posterPath: 'posters/poster.png',
  createdAt: DEFAULT_CREATED_AT,
  minAge: 8,
  runningMinutes: 150,
  description: '소개',
  performances: [{}],
  detailImages: [],
  seatGrades: [],
}).transform(insertShow);

async function insertVenue({ name }: VenueInput): Promise<number> {
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

async function insertShow({
  createdAt,
  performances: performanceInputs,
  detailImages,
  seatGrades: grades,
  ...show
}: ShowInput): Promise<number> {
  const [inserted] = await db
    .insert(shows)
    .values({ ...show, createdAt: new Date(createdAt) })
    .returning({ id: shows.id });
  if (!inserted) {
    throw new Error('공연을 넣지 못했습니다.');
  }
  const showId = inserted.id;
  const venueSeats = await db
    .select({ id: seats.id })
    .from(seats)
    .innerJoin(sections, eq(sections.id, seats.sectionId))
    .where(eq(sections.venueId, show.venueId))
    .orderBy(seats.id);
  for (const input of performanceInputs) {
    const { startsAt, salesOpenAt, isCancelled, soldSeats } =
      performanceFactory.build(input);
    const [performance] = await db
      .insert(performances)
      .values({
        showId,
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
      .values(detailImages.map((image) => ({ ...image, showId })));
  }
  if (grades.length > 0) {
    await db
      .insert(seatGrades)
      .values(grades.map((grade) => ({ ...grade, showId })));
  }
  return showId;
}
