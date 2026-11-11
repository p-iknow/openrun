import { describe, expect, it } from 'vitest';
import {
  getShowListHref,
  normalizeShowListQuery,
  getLastPageRedirectHref,
  type ShowListQuery,
} from './show-list-query';

const DEFAULT_QUERY: ShowListQuery = { page: 1, q: null, sort: 'start_date' };

describe('normalizeShowListQuery', () => {
  it('page가 없으면 1페이지이고 리다이렉트하지 않는다', () => {
    expect(normalizeShowListQuery({})).toEqual({
      query: { ...DEFAULT_QUERY, page: 1 },
      redirectTo: null,
    });
  });

  it('올바른 page는 그대로 두고 리다이렉트하지 않는다', () => {
    expect(normalizeShowListQuery({ page: '3' })).toEqual({
      query: { ...DEFAULT_QUERY, page: 3 },
      redirectTo: null,
    });
  });

  it('기본값인 page=1은 주소에서 빼도록 리다이렉트한다', () => {
    expect(normalizeShowListQuery({ page: '1' })).toEqual({
      query: { ...DEFAULT_QUERY, page: 1 },
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
        query: { ...DEFAULT_QUERY, page: 1 },
        redirectTo: '/',
      });
    },
  );

  describe('q', () => {
    it('검색어는 그대로 두고 리다이렉트하지 않는다', () => {
      expect(normalizeShowListQuery({ q: '해밀턴' })).toEqual({
        query: { ...DEFAULT_QUERY, q: '해밀턴' },
        redirectTo: null,
      });
    });

    it('앞뒤 공백을 지운 주소로 리다이렉트한다', () => {
      expect(normalizeShowListQuery({ q: '  달빛 정원 ' })).toEqual({
        query: { ...DEFAULT_QUERY, q: '달빛 정원' },
        redirectTo: '/?q=%EB%8B%AC%EB%B9%9B+%EC%A0%95%EC%9B%90',
      });
    });

    it.each([
      { name: '빈 값', q: '' },
      { name: '공백뿐인 값', q: '   ' },
      { name: '앞뒤 공백을 빼고 50자를 넘는 값', q: 'a'.repeat(51) },
      { name: '여러 번 들어온 값', q: ['a', 'b'] },
    ])('$name: 검색하지 않고 주소에서 빼도록 리다이렉트한다', ({ q }) => {
      expect(normalizeShowListQuery({ q })).toEqual({
        query: DEFAULT_QUERY,
        redirectTo: '/',
      });
    });

    it('앞뒤 공백을 빼고 50자인 값은 검색한다', () => {
      const fifty = 'a'.repeat(50);

      expect(normalizeShowListQuery({ q: ` ${fifty} ` }).query.q).toBe(fifty);
    });
  });

  describe('sort', () => {
    it('기본 정렬이 아닌 정렬은 그대로 두고 리다이렉트하지 않는다', () => {
      expect(normalizeShowListQuery({ sort: 'newest' })).toEqual({
        query: { ...DEFAULT_QUERY, sort: 'newest' },
        redirectTo: null,
      });
    });

    it('기본 정렬인 sort=start_date는 주소에서 빼도록 리다이렉트한다', () => {
      expect(normalizeShowListQuery({ sort: 'start_date' })).toEqual({
        query: DEFAULT_QUERY,
        redirectTo: '/',
      });
    });

    it.each([
      { name: '모르는 값', sort: 'popular' },
      { name: '여러 번 들어온 값', sort: ['newest', 'newest'] },
    ])(
      '$name: 기본 정렬로 고치고 주소에서 빼도록 리다이렉트한다',
      ({ sort }) => {
        expect(normalizeShowListQuery({ sort })).toEqual({
          query: DEFAULT_QUERY,
          redirectTo: '/',
        });
      },
    );
  });

  it('q, sort, page를 함께 둔 주소는 그대로 두고 리다이렉트하지 않는다', () => {
    expect(
      normalizeShowListQuery({ q: '정원', sort: 'newest', page: '2' }),
    ).toEqual({
      query: { q: '정원', sort: 'newest', page: 2 },
      redirectTo: null,
    });
  });

  it('모르는 쿼리는 버리도록 리다이렉트한다', () => {
    expect(normalizeShowListQuery({ page: '2', foo: 'bar' })).toEqual({
      query: { ...DEFAULT_QUERY, page: 2 },
      redirectTo: '/?page=2',
    });
  });
});

describe('getShowListHref', () => {
  it('기본값은 빼고 q, sort, page 순서로 주소를 만든다', () => {
    expect(getShowListHref(DEFAULT_QUERY)).toBe('/');
    expect(getShowListHref({ page: 3, q: 'a&b', sort: 'newest' })).toBe(
      '/?q=a%26b&sort=newest&page=3',
    );
  });
});

describe('getLastPageRedirectHref', () => {
  it('마지막 페이지 안이면 리다이렉트하지 않는다', () => {
    expect(
      getLastPageRedirectHref({
        query: { ...DEFAULT_QUERY, page: 3 },
        totalPages: 3,
      }),
    ).toBeNull();
  });

  it('마지막 페이지를 넘으면 다른 조건은 두고 마지막 페이지로 리다이렉트한다', () => {
    expect(
      getLastPageRedirectHref({
        query: { page: 9, q: '정원', sort: 'newest' },
        totalPages: 3,
      }),
    ).toBe('/?q=%EC%A0%95%EC%9B%90&sort=newest&page=3');
  });

  it('공연이 없으면 1페이지만 두고, 그보다 뒤면 1페이지로 리다이렉트한다', () => {
    expect(
      getLastPageRedirectHref({
        query: { ...DEFAULT_QUERY, page: 1 },
        totalPages: 0,
      }),
    ).toBeNull();
    expect(
      getLastPageRedirectHref({
        query: { ...DEFAULT_QUERY, page: 2 },
        totalPages: 0,
      }),
    ).toBe('/');
  });
});
