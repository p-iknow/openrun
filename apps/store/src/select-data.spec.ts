import { describe, expect, it } from 'vitest';
import { ApiError, selectData } from './select-data';

describe('selectData', () => {
  it('Problem Details 오류 응답을 앱 오류 코드가 담긴 ApiError로 바꾼다', () => {
    const result = {
      error: {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'Cannot GET /shows/999',
        code: 'NOT_FOUND',
      },
      response: new Response(null, { status: 404 }),
    };

    expect(() => selectData(result)).toThrow(
      expect.objectContaining({
        name: 'ApiError',
        status: 404,
        code: 'NOT_FOUND',
        message: 'Cannot GET /shows/999',
      }),
    );
  });

  it('Problem Details가 아닌 오류 응답은 UNKNOWN 코드와 HTTP 상태로 바꾼다', () => {
    // API 앞의 프록시가 HTML로 응답하면 openapi-fetch는 본문을 문자열로 넘긴다.
    const result = {
      error: '<html>502 Bad Gateway</html>',
      response: new Response(null, { status: 502 }),
    };

    expect(() => selectData(result)).toThrow(
      expect.objectContaining({ status: 502, code: 'UNKNOWN' }),
    );
    expect(() => selectData(result)).toThrow(ApiError);
  });

  it('성공 응답은 값을 그대로 돌려준다', () => {
    const result = {
      data: [{ id: 1, title: '레미제라블' }],
      response: new Response(null, { status: 200 }),
    };

    expect(selectData(result)).toEqual([{ id: 1, title: '레미제라블' }]);
  });
});
