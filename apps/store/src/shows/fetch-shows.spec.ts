import { createApiClient } from '@openrun/api-client';
import { describe, expect, it } from 'vitest';
import { fetchShows } from './fetch-shows';

// 요청마다 respond가 만든 응답을 돌려주는 클라이언트. Response 본문은 한 번만 읽을 수 있어서 값이 아니라 함수로 받는다.
function clientResponding(respond: () => Response) {
  return createApiClient({
    baseUrl: 'http://api.internal:3000',
    fetch: async () => respond(),
  });
}

describe('fetchShows', () => {
  it('API가 돌려준 공연 목록을 그대로 돌려준다', async () => {
    const client = clientResponding(() =>
      Response.json([
        { id: 1, title: '레미제라블' },
        { id: 2, title: '오페라의 유령' },
      ]),
    );

    await expect(fetchShows(client)).resolves.toEqual([
      { id: 1, title: '레미제라블' },
      { id: 2, title: '오페라의 유령' },
    ]);
  });

  it('API가 오류로 응답하면 빈 목록 대신 상태 코드를 담은 오류를 던진다', async () => {
    const client = clientResponding(() =>
      Response.json(
        { statusCode: 500, message: 'Internal server error' },
        { status: 500 },
      ),
    );

    await expect(fetchShows(client)).rejects.toThrow(
      '공연 목록을 불러오지 못했습니다 (HTTP 500)',
    );
  });
});
