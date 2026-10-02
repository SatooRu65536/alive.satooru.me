import { defineConfig } from 'vitest/config';

// Cloudflare プラグインを読み込まずに純粋関数のみをテストするため，vite.config.ts とは分けている
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
});
