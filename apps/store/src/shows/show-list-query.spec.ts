import { describe, expect, it } from 'vitest';
import {
  normalizeShowListQuery,
  selectPastLastPageRedirect,
} from './show-list-query';

describe('normalizeShowListQuery', () => {
  it('page가 없으면 1페이지이고 리다이렉트하지 않는다', () => {
    expect(normalizeShowListQuery({})).toEqual({
      query: { page: 1 },
      redirectTo: null,
    });
  });

  it('올바른 page는 그대로 두고 리다이렉트하지 않는다', () => {
    expect(normalizeShowListQuery({ page: '3' })).toEqual({
      query: { page: 3 },
      redirectTo: null,
    });
  });

  it('기본값인 page=1은 주소에서 빼도록 리다이렉트한다', () => {
    expect(normalizeShowListQuery({ page: '1' })).toEqual({
      query: { page: 1 },
      redirectTo: '/',
    });
  });

  it.each([
    { name: '숫자가 아닌 값', page: 'abc' },
    { name: '0', page: '0' },
    { name: '음수', page: '-2' },
    { name: '소수', page: '1.5' },
    { name: '앞에 0이 붙은 값', page: '02' },
    { name: '빈 값', page: '' },
    { name: '정확히 다룰 수 없는 큰 수', page: '9007199254740993' },
    { name: '여러 번 들어온 값', page: ['2', '3'] },
  ])(
    '잘못된 page($name)는 1로 고치고 주소에서 빼도록 리다이렉트한다',
    ({ page }) => {
      expect(normalizeShowListQuery({ page })).toEqual({
        query: { page: 1 },
        redirectTo: '/',
      });
    },
  );

  it('모르는 쿼리는 버리도록 리다이렉트한다', () => {
    expect(normalizeShowListQuery({ page: '2', foo: 'bar' })).toEqual({
      query: { page: 2 },
      redirectTo: '/?page=2',
    });
  });
});

describe('selectPastLastPageRedirect', () => {
  it('마지막 페이지 안이면 리다이렉트하지 않는다', () => {
    expect(
      selectPastLastPageRedirect({
        query: { page: 3 },
        totalPages: 3,
      }),
    ).toBeNull();
  });

  it('마지막 페이지를 넘으면 마지막 페이지로 리다이렉트한다', () => {
    expect(
      selectPastLastPageRedirect({
        query: { page: 9 },
        totalPages: 3,
      }),
    ).toBe('/?page=3');
  });

  it('공연이 없으면 1페이지만 두고, 그보다 뒤면 1페이지로 리다이렉트한다', () => {
    expect(
      selectPastLastPageRedirect({
        query: { page: 1 },
        totalPages: 0,
      }),
    ).toBeNull();
    expect(
      selectPastLastPageRedirect({
        query: { page: 2 },
        totalPages: 0,
      }),
    ).toBe('/');
  });
});
