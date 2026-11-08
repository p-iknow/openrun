import { configDefaults, defineConfig } from 'vitest/config';

// Nest DI에 필요한 데코레이터 메타데이터는 Vite 8의 기본 변환(Oxc)이 tsconfig의
// emitDecoratorMetadata를 읽어 만든다. 그래서 SWC 플러그인을 쓰지 않는다.
export default defineConfig({
  test: {
    // 모듈 단위 테스트는 소스 옆(src)에, 앱 전체를 띄우는 테스트는 test에 둔다.
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    // DB가 필요한 테스트는 vitest.integration.config.ts로 test:integration에서만 실행한다.
    exclude: [...configDefaults.exclude, '**/*.int.spec.ts'],
    passWithNoTests: true,
  },
});
