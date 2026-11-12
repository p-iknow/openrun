import { describe, expect, it } from 'vitest';
import {
  getConditionResetHref,
  getFilterApplyHref,
  getGenreChangeQuery,
  getSearchSubmitHref,
  getStatusChangeQuery,
  hasNarrowingCondition,
  getShowListQueryFromSearch,
  getShowListHref,
  getSortChangeHref,
  normalizeShowListQuery,
  getLastPageRedirectHref,
  type ShowListQuery,
} from './show-list-query';

const DEFAULT_QUERY: ShowListQuery = {
  page: 1,
  q: null,
  genre: [],
  status: [],
  sort: 'start_date',
};

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

  describe('genre', () => {
    it('장르 하나는 배열로 담고 리다이렉트하지 않는다', () => {
      expect(normalizeShowListQuery({ genre: 'musical' })).toEqual({
        query: { ...DEFAULT_QUERY, genre: ['musical'] },
        redirectTo: null,
      });
    });

    it('여러 장르를 장르 목록 순서대로 둔 주소는 리다이렉트하지 않는다', () => {
      expect(normalizeShowListQuery({ genre: ['musical', 'concert'] })).toEqual(
        {
          query: { ...DEFAULT_QUERY, genre: ['musical', 'concert'] },
          redirectTo: null,
        },
      );
    });

    it('모르는 장르는 버리도록 리다이렉트한다', () => {
      expect(normalizeShowListQuery({ genre: ['opera', 'play'] })).toEqual({
        query: { ...DEFAULT_QUERY, genre: ['play'] },
        redirectTo: '/?genre=play',
      });
    });

    it('겹친 장르는 하나로 줄이고 장르 목록 순서로 고치도록 리다이렉트한다', () => {
      expect(
        normalizeShowListQuery({ genre: ['concert', 'musical', 'concert'] }),
      ).toEqual({
        query: { ...DEFAULT_QUERY, genre: ['musical', 'concert'] },
        redirectTo: '/?genre=musical&genre=concert',
      });
    });
  });

  describe('status', () => {
    it('판매 중과 판매 예정은 판매 상태 목록 순서대로 담는다', () => {
      expect(
        normalizeShowListQuery({ status: ['upcoming', 'on_sale'] }),
      ).toEqual({
        query: { ...DEFAULT_QUERY, status: ['on_sale', 'upcoming'] },
        redirectTo: '/?status=on_sale&status=upcoming',
      });
    });

    it.each([
      { name: '모르는 값', status: 'sold_out' },
      // 판매 종료 공연은 목록에 없으므로 선택지가 아니다.
      { name: '판매 종료', status: 'ended' },
    ])('$name: 버리도록 리다이렉트한다', ({ status }) => {
      expect(normalizeShowListQuery({ status })).toEqual({
        query: DEFAULT_QUERY,
        redirectTo: '/',
      });
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

  it('q, genre, status, sort, page를 함께 둔 주소는 그대로 두고 리다이렉트하지 않는다', () => {
    expect(
      normalizeShowListQuery({
        q: '정원',
        genre: 'play',
        status: 'upcoming',
        sort: 'newest',
        page: '2',
      }),
    ).toEqual({
      query: {
        q: '정원',
        genre: ['play'],
        status: ['upcoming'],
        sort: 'newest',
        page: 2,
      },
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

describe('getShowListQueryFromSearch', () => {
  it('주소의 쿼리 문자열을 normalizeShowListQuery와 같은 규칙으로 정리한다', () => {
    expect(
      getShowListQueryFromSearch(
        new URLSearchParams('q=+%EC%A0%95%EC%9B%90+&sort=newest&page=2&foo=1'),
      ),
    ).toEqual({ ...DEFAULT_QUERY, q: '정원', sort: 'newest', page: 2 });
  });

  it('여러 번 들어온 값은 잘못된 값으로 본다', () => {
    expect(
      getShowListQueryFromSearch(
        new URLSearchParams('sort=newest&sort=newest'),
      ),
    ).toEqual(DEFAULT_QUERY);
  });
});

describe('getShowListHref', () => {
  it('기본값은 빼고 q, genre, status, sort, page 순서로 주소를 만든다', () => {
    expect(getShowListHref(DEFAULT_QUERY)).toBe('/');
    expect(
      getShowListHref({
        page: 3,
        q: 'a&b',
        genre: ['play'],
        status: ['on_sale', 'upcoming'],
        sort: 'newest',
      }),
    ).toBe(
      '/?q=a%26b&genre=play&status=on_sale&status=upcoming&sort=newest&page=3',
    );
  });
});

describe('getSortChangeHref', () => {
  it('검색어는 두고 정렬을 바꾸며 page를 빼서 1페이지로 돌아간다', () => {
    expect(
      getSortChangeHref({
        query: { ...DEFAULT_QUERY, page: 3, q: '정원' },
        value: 'newest',
      }),
    ).toBe(encodeURI('/?q=정원&sort=newest'));
  });

  it('모르는 정렬값이면 주소를 만들지 않는다', () => {
    expect(
      getSortChangeHref({ query: DEFAULT_QUERY, value: 'popular' }),
    ).toBeNull();
  });
});

describe('getGenreChangeQuery', () => {
  it('다른 조건은 두고 고른 장르로 바꾸며 1페이지로 돌아간다', () => {
    expect(
      getGenreChangeQuery({
        query: {
          ...DEFAULT_QUERY,
          page: 3,
          q: '정원',
          status: ['on_sale'],
          sort: 'newest',
        },
        value: ['concert', 'musical'],
      }),
    ).toEqual({
      page: 1,
      q: '정원',
      genre: ['musical', 'concert'],
      status: ['on_sale'],
      sort: 'newest',
    });
  });

  it('모르는 장르는 버린다', () => {
    expect(
      getGenreChangeQuery({ query: DEFAULT_QUERY, value: ['opera', 'play'] })
        .genre,
    ).toEqual(['play']);
  });

  it('장르를 모두 풀면 장르로 거르지 않는다', () => {
    expect(
      getShowListHref(
        getGenreChangeQuery({
          query: { ...DEFAULT_QUERY, genre: ['play'], page: 2 },
          value: [],
        }),
      ),
    ).toBe('/');
  });
});

describe('getStatusChangeQuery', () => {
  it('다른 조건은 두고 고른 판매 상태로 바꾸며 1페이지로 돌아간다', () => {
    expect(
      getStatusChangeQuery({
        query: { ...DEFAULT_QUERY, page: 3, genre: ['play'] },
        value: ['upcoming', 'ended'],
      }),
    ).toEqual({ ...DEFAULT_QUERY, genre: ['play'], status: ['upcoming'] });
  });
});

describe('getFilterApplyHref', () => {
  it('고른 값을 바꾸지 않고 적용해도 page를 빼서 1페이지로 간다', () => {
    expect(
      getFilterApplyHref({
        query: { ...DEFAULT_QUERY, genre: ['play'], page: 3 },
        genre: ['play'],
        status: [],
      }),
    ).toBe('/?genre=play');
  });

  it('검색어와 정렬은 두고 장르와 판매 상태를 시트에서 고른 값으로 바꾼다', () => {
    expect(
      getFilterApplyHref({
        query: {
          ...DEFAULT_QUERY,
          q: '정원',
          genre: ['play'],
          status: ['upcoming'],
          sort: 'newest',
        },
        genre: ['musical', 'concert'],
        status: [],
      }),
    ).toBe(encodeURI('/?q=정원&genre=musical&genre=concert&sort=newest'));
  });

  it('모르는 값과 겹친 값은 버리고 선택지 순서로 맞춘다', () => {
    expect(
      getFilterApplyHref({
        query: DEFAULT_QUERY,
        genre: ['concert', 'unknown', 'musical', 'concert'],
        status: ['upcoming', 'ended', 'on_sale'],
      }),
    ).toBe('/?genre=musical&genre=concert&status=on_sale&status=upcoming');
  });
});

describe('hasNarrowingCondition', () => {
  it.each([
    { name: '조건이 없을 때', query: DEFAULT_QUERY, expected: false },
    {
      name: '정렬과 page만 있을 때',
      query: { ...DEFAULT_QUERY, sort: 'newest' as const, page: 2 },
      expected: false,
    },
    { name: '검색어', query: { ...DEFAULT_QUERY, q: '정원' }, expected: true },
    {
      name: '장르',
      query: { ...DEFAULT_QUERY, genre: ['play' as const] },
      expected: true,
    },
    {
      name: '판매 상태',
      query: { ...DEFAULT_QUERY, status: ['upcoming' as const] },
      expected: true,
    },
  ])('$name: $expected', ({ query, expected }) => {
    expect(hasNarrowingCondition(query)).toBe(expected);
  });
});

describe('getConditionResetHref', () => {
  it('결과를 좁히는 검색어, 장르, 판매 상태를 지우고 정렬은 두며 1페이지로 간다', () => {
    expect(
      getConditionResetHref({
        page: 2,
        q: '정원',
        genre: ['play'],
        status: ['on_sale'],
        sort: 'newest',
      }),
    ).toBe('/?sort=newest');
  });
});

describe('getSearchSubmitHref', () => {
  it('정렬은 두고 검색어를 바꾸며 page를 빼서 1페이지로 돌아간다', () => {
    expect(
      getSearchSubmitHref({
        query: { ...DEFAULT_QUERY, page: 3, q: '정원', sort: 'newest' },
        value: '햄릿',
      }),
    ).toBe('/?q=%ED%96%84%EB%A6%BF&sort=newest');
  });

  it('검색어의 앞뒤 공백을 지운다', () => {
    expect(
      getSearchSubmitHref({ query: DEFAULT_QUERY, value: '  햄릿 ' }),
    ).toBe('/?q=%ED%96%84%EB%A6%BF');
  });

  it('공백만 있는 검색어면 검색어를 뺀다', () => {
    expect(
      getSearchSubmitHref({
        query: { ...DEFAULT_QUERY, page: 2, q: '정원', sort: 'newest' },
        value: '   ',
      }),
    ).toBe('/?sort=newest');
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
        query: { ...DEFAULT_QUERY, page: 9, q: '정원', sort: 'newest' },
        totalPages: 3,
      }),
    ).toBe(encodeURI('/?q=정원&sort=newest&page=3'));
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
