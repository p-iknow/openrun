import swc from 'unplugin-swc';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    // DB가 필요한 테스트는 vitest.integration.config.ts로 test:integration에서만 실행한다.
    exclude: [...configDefaults.exclude, 'test/**/*.int.spec.ts'],
    passWithNoTests: true,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
