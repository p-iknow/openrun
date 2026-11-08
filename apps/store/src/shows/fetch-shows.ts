import type { ApiClient, components } from '@openrun/api-client';

export type Show = components['schemas']['ShowDto'];

export async function fetchShows(client: ApiClient): Promise<Show[]> {
  const { data, response } = await client.GET('/shows');
  // 오류 응답 규격은 1.3에서 정한다. 그 전까지는 상태 코드만 담아 던진다.
  if (data === undefined) {
    throw new Error(
      `공연 목록을 불러오지 못했습니다 (HTTP ${response.status})`,
    );
  }
  return data;
}
