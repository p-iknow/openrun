import { transformErrorResponse } from './api-error';

// openapi-fetch의 응답({ data, error, response })에서 성공 값을 꺼내고, 오류면 ApiError를 던진다.
// 이름은 RTK Query의 unwrap()을 따랐다. 화면에 맞게 값을 바꾸는 일은 select 함수가 맡는다.
// 본문 없는 성공 응답(204)을 돌려주는 경로는 아직 없으므로, 값이 없으면 오류로 본다.
export function unwrap<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (result.data !== undefined) {
    return result.data;
  }
  throw transformErrorResponse({
    error: result.error,
    response: result.response,
  });
}
