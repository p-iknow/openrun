import { integer, pgTable, text, unique } from 'drizzle-orm/pg-core';

// 공연장, 구역, 좌석은 공연과 별개로 존재하며 시드로만 만든다(좌석 배치 편집기는 만들지 않는다).
export const venues = pgTable('venues', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
});

// 공연장의 좌석을 나눈 묶음으로, 좌석의 위치(예: A구역 C열 5번)를 나타낸다. 좌석 등급은 구역이 아니라 좌석마다 지정한다.
export const sections = pgTable(
  'sections',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    venueId: integer('venue_id')
      .notNull()
      .references(() => venues.id),
    name: text().notNull(),
  },
  // 같은 공연장에 같은 이름의 구역이 두 번 들어가지 않게 막는다. 이름이 겹치면 "A구역 C열 5번"이 두 자리가 된다.
  // 이 제약이 만드는 인덱스가 venue_id로 시작하므로, 공연장 하나의 구역을 찾을 때도 쓰인다.
  (table) => [unique().on(table.venueId, table.name)],
);

// 공연장에 물리적으로 있는 자리다. 판매 여부는 회차 좌석이 갖는다.
export const seats = pgTable(
  'seats',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => sections.id),
    // 열 이름(예: A)과 열 안의 번호(1부터)다.
    row: text().notNull(),
    number: integer().notNull(),
  },
  // 같은 구역에 같은 열·번호 좌석이 두 번 들어가지 않게 막는다.
  // 이 제약이 만드는 인덱스가 section_id로 시작하므로, 구역 하나의 좌석을 찾을 때도 쓰인다.
  (table) => [unique().on(table.sectionId, table.row, table.number)],
);
