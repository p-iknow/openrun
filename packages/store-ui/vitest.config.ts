import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Vitest는 CSS import를 기본으로 비운다. 토큰 이름을 읽는 테스트를 위해 tokens.css만 살린다.
    css: { include: [/tokens\.css/] },
  },
});
