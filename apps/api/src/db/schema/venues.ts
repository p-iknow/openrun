import { index, integer, pgTable, text, unique } from 'drizzle-orm/pg-core';

// 공연장, 구역, 좌석은 공연과 별개로 존재하며 시드로만 만든다(좌석 배치 편집기는 만들지 않는다).
export const venues = pgTable('venues', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
});

// 공연마다 좌석 등급을 지정하는 단위다. 좌석 등급은 뒤 티켓에서 붙인다.
export const sections = pgTable(
  'sections',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    venueId: integer('venue_id')
      .notNull()
      .references(() => venues.id),
    name: text().notNull(),
  },
  (table) => [index().on(table.venueId)],
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
  // 유니크 제약의 인덱스가 section_id로 시작하므로 구역별 조회에도 쓰인다.
  (table) => [unique().on(table.sectionId, table.row, table.number)],
);
