import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { venues } from './venues.js';

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
