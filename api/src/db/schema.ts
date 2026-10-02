import { integer, real, sqliteTable } from 'drizzle-orm/sqlite-core';

export const heartRates = sqliteTable('heart_rates', {
  // 主キーにすることで，再送された同じ時刻のサンプルを挿入時に無視できるようにする
  measuredAt: integer('measured_at').primaryKey(),
  bpm: real('bpm').notNull(),
});
