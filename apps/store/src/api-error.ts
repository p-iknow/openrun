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

// 오류 응답 본문을 ApiError로 바꾼다. 이름은 RTK Query의 transformErrorResponse를 따랐다.
export function transformErrorResponse({
  error,
  response,
}: {
  error: unknown;
  response: Response;
}): ApiError {
  if (isProblemDetails(error)) {
    return new ApiError({
      status: response.status,
      code: error.code,
      message: error.detail,
    });
  }
  return new ApiError({
    status: response.status,
    code: 'UNKNOWN',
    message: `API가 오류로 응답했습니다 (HTTP ${response.status})`,
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
