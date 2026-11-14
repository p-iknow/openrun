import { describe, expect, it } from 'vitest';
import { getGenreChipLabel } from './filter-items';

describe('getGenreChipLabel', () => {
  it('고른 장르가 없으면 묶음 이름을 보인다', () => {
    expect(getGenreChipLabel([])).toBe('장르');
  });

  it('고른 장르가 있으면 이름을 쉼표로 이어 보인다', () => {
    expect(getGenreChipLabel(['musical', 'play'])).toBe('뮤지컬,연극');
  });
});
