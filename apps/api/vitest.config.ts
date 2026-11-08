import swc from 'unplugin-swc';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 모듈 단위 테스트는 소스 옆(src)에, 앱 전체를 띄우는 테스트는 test에 둔다.
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    // DB가 필요한 테스트는 vitest.integration.config.ts로 test:integration에서만 실행한다.
    exclude: [...configDefaults.exclude, '**/*.int.spec.ts'],
    passWithNoTests: true,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
