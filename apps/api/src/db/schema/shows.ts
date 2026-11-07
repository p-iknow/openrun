import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const shows = pgTable('shows', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text().notNull(),
});
