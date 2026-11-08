import { describe, expect, it } from 'vitest';
import { cn } from './cn.js';
import { readTokens } from './docs/read-tokens.js';
import tokensCss from './tokens.css?raw';

const tokens = readTokens(tokensCss);

describe('cn', () => {
  it('조건부 클래스를 이어 붙인다', () => {
    expect(
      cn('p-lg', false, undefined, { 'bg-primary': true, 'bg-surface': false }),
    ).toBe('p-lg bg-primary');
  });

  it('같은 속성의 클래스는 뒤에 온 것만 남긴다', () => {
    expect(cn('bg-surface-muted', 'bg-primary')).toBe('bg-primary');
  });

  // 글자 크기와 글자색이 모두 `text-` 접두사를 쓰므로, 토큰을 모르면 하나를 지운다.
  it.each(tokens.textSizes.map((t) => t.name))(
    '글자 크기 text-%s와 글자색 text-text를 함께 남긴다',
    (size) => {
      expect(cn(`text-${size}`, 'text-text')).toBe(`text-${size} text-text`);
    },
  );

  it.each(tokens.textSizes.map((t) => t.name))(
    '글자 크기 text-%s끼리는 뒤의 것만 남긴다',
    (size) => {
      expect(cn('text-display', `text-${size}`)).toBe(`text-${size}`);
    },
  );

  it.each(tokens.colors.map((c) => c.name))(
    '글자색 text-%s끼리는 뒤의 것만 남긴다',
    (color) => {
      expect(cn('text-text', `text-${color}`)).toBe(`text-${color}`);
    },
  );

  it.each(tokens.spacing.map((s) => s.name))(
    '간격 p-%s는 앞의 간격을 덮는다',
    (space) => {
      expect(cn('p-3xl', `p-${space}`)).toBe(`p-${space}`);
    },
  );

  it.each(tokens.radii.map((r) => r.name))(
    '모서리 rounded-%s는 앞의 모서리를 덮는다',
    (radius) => {
      expect(cn('rounded-panel', `rounded-${radius}`)).toBe(
        `rounded-${radius}`,
      );
    },
  );

  it('최대 폭 max-w-content는 앞의 최대 폭을 덮는다', () => {
    expect(cn('max-w-[100px]', 'max-w-content')).toBe('max-w-content');
  });

  it('그림자 shadow-floating과 그림자 색은 함께 남긴다', () => {
    expect(cn('shadow-floating', 'shadow-primary')).toBe(
      'shadow-floating shadow-primary',
    );
  });
});
