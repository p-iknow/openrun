import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
  },
  // Vite의 기본 변환기는 데코레이터 메타데이터를 만들지 않는다. NestJS의 의존성 주입에 필요하다.
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
