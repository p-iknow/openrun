import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { seats, venues } from './venues.js';

// 장르는 고정 목록이다. 값을 더하거나 빼면 마이그레이션이 필요하다.
export const GENRES = [
  'musical',
  'play',
  'concert',
  'classical_dance',
  'kids_family',
] as const;
export type Genre = (typeof GENRES)[number];

export const genre = pgEnum('genre', GENRES);

export const shows = pgTable(
  'shows',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    venueId: integer('venue_id')
      .notNull()
      .references(() => venues.id),
    title: text().notNull(),
    genre: genre().notNull(),
    // 관람할 수 있는 최소 나이(만 나이)다. 0이면 전체 관람가다.
    minAge: integer('min_age').notNull(),
    runningMinutes: integer('running_minutes').notNull(),
    description: text().notNull(),
    // 포스터 파일의 저장소 안 경로다. 완전한 URL은 API가 POSTER_BASE_URL과 합쳐 만든다.
    posterKey: text('poster_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.venueId)],
);

export const performances = pgTable(
  'performances',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    showId: integer('show_id')
      .notNull()
      .references(() => shows.id),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    salesOpenAt: timestamp('sales_open_at', { withTimezone: true }).notNull(),
    // 판매 상태는 저장하지 않고 조회할 때 계산한다. 저장하는 것은 회차 취소 여부뿐이다.
    isCancelled: boolean('is_cancelled').notNull().default(false),
  },
  (table) => [index().on(table.showId)],
);

// 회차에서 판매되는 좌석 하나다. 회차를 만들 때 공연장의 좌석 수만큼 만든다.
// 회차 좌석의 소유 모듈은 1.5(예매)에서 다시 정한다. 지금은 회차와 함께 shows 모듈에 둔다.
export const performanceSeats = pgTable(
  'performance_seats',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    performanceId: integer('performance_id')
      .notNull()
      .references(() => performances.id),
    seatId: integer('seat_id')
      .notNull()
      .references(() => seats.id),
    // 판매 여부. false가 판매 가능, true가 판매됨이다.
    isSold: boolean('is_sold').notNull().default(false),
  },
  // 같은 회차에 같은 좌석이 두 번 들어가지 않게 막는다.
  // 이 제약이 만드는 인덱스가 performance_id로 시작하므로, 회차 하나의 좌석을 찾을 때도 쓰인다.
  (table) => [unique().on(table.performanceId, table.seatId)],
);
