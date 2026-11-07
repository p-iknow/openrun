import { createApiClient } from '@openrun/api-client';
import { describe, expect, it } from 'vitest';
import { fetchShows } from '../src/shows/fetch-shows';

const baseUrl = 'http://api.internal:3000';

function clientResponding(respond: (request: Request) => Response) {
  const requests: Request[] = [];
  const client = createApiClient({
    baseUrl,
    fetch: async (request: Request) => {
      requests.push(request);
      return respond(request);
    },
  });
  return { client, requests };
}

describe('fetchShows', () => {
  it('API의 GET /shows를 호출해 공연 목록을 돌려준다', async () => {
    const { client, requests } = clientResponding(() =>
      Response.json([
        { id: 1, title: '레미제라블' },
        { id: 2, title: '오페라의 유령' },
      ]),
    );

    const shows = await fetchShows(client);

    expect(shows).toEqual([
      { id: 1, title: '레미제라블' },
      { id: 2, title: '오페라의 유령' },
    ]);
    expect(
      requests.map((request) => `${request.method} ${request.url}`),
    ).toEqual(['GET http://api.internal:3000/shows']);
  });

  it('API가 오류로 응답하면 빈 목록 대신 상태 코드를 담은 오류를 던진다', async () => {
    const { client } = clientResponding(() =>
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
