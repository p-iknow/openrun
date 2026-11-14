import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // tsconfig.json의 paths와 같게 둔다.
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./apps-src/@shared', import.meta.url)),
      '@apps-src': fileURLToPath(new URL('./apps-src', import.meta.url)),
    },
  },
  test: {
    include: ['apps-src/**/*.spec.ts'],
  },
});
