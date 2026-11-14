import {
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
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
    // 포스터 파일의 공연 이미지 저장소 안 경로다(예: posters/show-01.png). 완전한 URL은 API가 SHOW_IMAGE_BASE_URL과 합쳐 만든다.
    posterPath: text('poster_path').notNull(),
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
// 회차 좌석의 소유 모듈은 예매 기능을 만들 때 다시 정한다. 지금은 회차와 함께 shows 모듈에 둔다.
export const performanceSeats = pgTable(
  'performance_seats',
  {
    // (performance_id, seat_id) 조합 대신 id를 기본 키로 둔다. 예매에서 좌석 선점, 주문, 티켓이 회차 좌석을 가리키는데,
    // 조합이 기본 키면 그 테이블마다 칸 두 개와 복합 외래 키가 필요하다. id 하나면 칸 하나로 가리킨다.
    // 아무도 가리키지 않는 좌석 등급 지정(seat_grade_assignments)은 조합을 기본 키로 둔다.
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

// 공연 소개를 담은 세로로 긴 이미지(상세 이미지)다. 실제 예매 서비스처럼 공연마다 순서대로 여러 장을 둔다.
// 이미지 속 글은 공연의 소개 본문(description)에 글로 옮겨 둔다. 화면 낭독기는 이미지 대신 그 글을 읽는다.
export const showDetailImages = pgTable(
  'show_detail_images',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    showId: integer('show_id')
      .notNull()
      .references(() => shows.id),
    // 공연 안에서 보여 줄 순서(1부터)다.
    position: integer().notNull(),
    // 공연 이미지 저장소 안 경로다(예: details/show-01-1.png). 완전한 URL은 API가 SHOW_IMAGE_BASE_URL과 합쳐 만든다.
    path: text().notNull(),
  },
  // 한 공연에 같은 순서가 두 번 들어가지 않게 막는다.
  // 이 제약이 만드는 인덱스가 show_id로 시작하므로, 공연 하나의 상세 이미지를 순서대로 찾을 때도 쓰인다.
  (table) => [unique().on(table.showId, table.position)],
);

// 공연별로 정하는 좌석 분류(예: VIP석 170,000원)다. 회차마다 가격을 다르게 두지 않는다.
export const seatGrades = pgTable(
  'seat_grades',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    showId: integer('show_id')
      .notNull()
      .references(() => shows.id),
    name: text().notNull(),
    // 원 단위 정수다. 원보다 작은 단위가 없어 소수를 쓰지 않는다.
    price: integer().notNull(),
  },
  (table) => [
    // 한 공연에 같은 이름의 등급이 두 번 들어가지 않게 막는다. 이 제약이 만드는 인덱스가 show_id로 시작하므로,
    // 공연 하나의 등급을 찾을 때도 쓰인다.
    unique().on(table.showId, table.name),
    // seat_grade_assignments의 외래 키가 이 (id, show_id) 묶음을 가리킨다.
    // id만으로 이미 유일해서 의미로는 중복이지만, PostgreSQL은 외래 키가 가리키는 컬럼 묶음과
    // 정확히 같은 유일 제약(또는 PK)이 있어야 외래 키를 만들어 준다.
    unique().on(table.id, table.showId),
  ],
);

// 공연이 자기 공연장의 좌석 하나에 등급 하나를 지정한 것이다. 한 등급이 여러 좌석에 붙고,
// 같은 구역 안에서도 열에 따라 등급이 다를 수 있다.
export const seatGradeAssignments = pgTable(
  'seat_grade_assignments',
  {
    showId: integer('show_id')
      .notNull()
      .references(() => shows.id),
    seatId: integer('seat_id')
      .notNull()
      .references(() => seats.id),
    seatGradeId: integer('seat_grade_id').notNull(),
  },
  (table) => [
    // 공연마다 좌석 하나에 등급은 하나뿐이다. 이 키의 인덱스가 show_id로 시작하므로, 공연 하나의 지정을 찾을 때도 쓰인다.
    primaryKey({ columns: [table.showId, table.seatId] }),
    // 다른 공연의 등급을 지정하지 못하게 막는다. seat_grade_id 하나로만 참조하면 등급이 있는지만 확인해서,
    // 공연 1의 좌석에 공연 2의 등급을 지정해도 통과한다. (seat_grade_id, show_id)를 묶어 참조하면
    // "이 id이면서 이 공연의 등급"이 있어야 하므로, 지정의 공연과 등급의 공연이 늘 같다.
    // 자동으로 짓는 이름은 PostgreSQL 이름 길이(63자)를 넘어 잘리므로 직접 짓는다.
    foreignKey({
      name: 'seat_grade_assignments_seat_grade_fk',
      columns: [table.seatGradeId, table.showId],
      foreignColumns: [seatGrades.id, seatGrades.showId],
    }),
    // 좌석이 공연의 공연장에 있는지와 공연장의 모든 좌석에 지정했는지는 DB 제약으로 막지 않는다.
    // 지금은 시드가 지키고, 어드민에 공연 등록이 생기면 등록할 때 검증한다.
  ],
);
