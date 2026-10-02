import { defineConfig } from 'drizzle-kit';

// マイグレーションの適用は wrangler d1 migrations apply で行うため，drizzle-kit は SQL の生成のみに使う
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',
});
