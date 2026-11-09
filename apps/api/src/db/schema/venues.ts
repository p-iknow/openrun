import { integer, pgTable, text } from 'drizzle-orm/pg-core';

// 공연장은 공연과 별개로 존재하며 시드로만 만든다. 구역과 좌석은 뒤 티켓에서 붙인다.
export const venues = pgTable('venues', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
});
