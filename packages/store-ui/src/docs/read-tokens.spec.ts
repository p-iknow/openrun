import { describe, expect, it } from 'vitest';
import { readTokens } from './read-tokens.js';

describe('readTokens', () => {
  it('@theme 안에 중첩 블록(@keyframes)이 있어도 그 뒤의 토큰을 읽는다', () => {
    const css = `
      :root {
        --grey-900: #191f28;
      }
      @theme {
        --color-text: var(--grey-900);
        @keyframes fade {
          0% { --ignored: 1; opacity: 0; }
        }
        --spacing-sm: 0.5rem;
      }
    `;

    const tokens = readTokens(css);

    expect(tokens.colors).toEqual([
      { name: 'text', palette: 'grey-900', hex: '#191f28' },
    ]);
    expect(tokens.spacing).toEqual([{ name: 'sm', value: '0.5rem' }]);
  });
});
