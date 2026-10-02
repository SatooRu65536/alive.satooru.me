import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: ['**/worker-configuration.d.ts', '.claude/settings.local.json'],
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  sortImports: true,
  sortPackageJson: true,
});
