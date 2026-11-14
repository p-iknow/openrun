import { describe, expect, it } from 'vitest';
import { ApiError, transformErrorResponse } from './api-error';

describe('transformErrorResponse', () => {
  it('Problem Details 오류 응답을 앱 오류 코드가 담긴 ApiError로 바꾼다', () => {
    const apiError = transformErrorResponse({
      error: {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'Cannot GET /shows/999',
        code: 'NOT_FOUND',
      },
      response: new Response(null, { status: 404 }),
    });

    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Cannot GET /shows/999',
    });
  });

  it('Problem Details가 아닌 오류 응답은 UNKNOWN 코드와 HTTP 상태로 바꾼다', () => {
    // API 앞의 프록시가 HTML로 응답하면 openapi-fetch는 본문을 문자열로 넘긴다.
    const apiError = transformErrorResponse({
      error: '<html>502 Bad Gateway</html>',
      response: new Response(null, { status: 502 }),
    });

    expect(apiError).toMatchObject({ status: 502, code: 'UNKNOWN' });
  });
});
