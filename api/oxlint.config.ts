import { defineConfig } from 'oxlint';

export default defineConfig({
  ignorePatterns: ['**/routeTree.gen.ts', '.claude/settings.local.json'],
  plugins: ['typescript', 'unicorn', 'oxc', 'node', 'import'],
  categories: {
    correctness: 'error',
  },
  rules: {
    'import/no-default-export': 'error',
    'import/no-relative-parent-imports': 'error',
  },
  env: {
    builtin: true,
    browser: true,
    node: true,
  },
});
