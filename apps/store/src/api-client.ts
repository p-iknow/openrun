import { createApiClient } from '@openrun/api-client';

// 서버 렌더링에서만 쓴다. 요청 시점에 읽어야 하므로 connection() 뒤에서 호출한다.
export function createServerApiClient() {
  const baseUrl = process.env.API_INTERNAL_URL;
  if (!baseUrl) {
    throw new Error('필수 환경 변수가 없습니다: API_INTERNAL_URL');
  }

  return createApiClient({ baseUrl });
}
