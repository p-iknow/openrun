import type { components } from '@openrun/api-client';

type ProblemDetails = components['schemas']['ProblemDetailsDto'];

// API가 오류로 응답했을 때 던진다. 화면은 사람이 읽는 문구(message) 대신 code로 오류를 구분한다.
export class ApiError extends Error {
  readonly name = 'ApiError';
  readonly status: number;
  // API의 앱 오류 코드. 응답이 Problem Details가 아니면 'UNKNOWN'이다.
  readonly code: string;

  constructor(options: { status: number; code: string; message: string }) {
    super(options.message);
    this.status = options.status;
    this.code = options.code;
  }
}

// openapi-fetch의 응답({ data, error, response })을 성공 값으로 바꾸고, 오류면 ApiError를 던진다.
// 본문 없는 성공 응답(204)을 돌려주는 경로는 아직 없으므로, 값이 없으면 오류로 본다.
export function selectData<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (result.data !== undefined) {
    return result.data;
  }

  const { status } = result.response;
  if (isProblemDetails(result.error)) {
    throw new ApiError({
      status,
      code: result.error.code,
      message: result.error.detail,
    });
  }
  throw new ApiError({
    status,
    code: 'UNKNOWN',
    message: `API가 오류로 응답했습니다 (HTTP ${status})`,
  });
}

// API 앞의 프록시나 게이트웨이가 응답하면 본문이 Problem Details가 아닐 수 있다.
function isProblemDetails(body: unknown): body is ProblemDetails {
  return (
    typeof body === 'object' &&
    body !== null &&
    'code' in body &&
    typeof body.code === 'string' &&
    'detail' in body &&
    typeof body.detail === 'string'
  );
}
