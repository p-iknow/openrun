import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.int.spec.ts'],
    globalSetup: ['test/setup/postgres.ts'],
    hookTimeout: 120_000,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
