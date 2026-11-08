import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.int.spec.ts'],
    globalSetup: ['test/setup/postgres.ts'],
    hookTimeout: 120_000,
  },
});
