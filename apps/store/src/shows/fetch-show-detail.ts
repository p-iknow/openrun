import type { ApiClient, components } from '@openrun/api-client';
import { unwrap } from '../unwrap';

export type ShowDetail = components['schemas']['ShowDetailDto'];

// 없는 공연이면 unwrap이 code가 SHOW_NOT_FOUND인 ApiError를 던진다. 404 화면으로 바꾸는 일은 페이지가 맡는다.
export async function fetchShowDetail({
  client,
  id,
}: {
  client: ApiClient;
  id: number;
}): Promise<ShowDetail> {
  return unwrap(await client.GET('/shows/{id}', { params: { path: { id } } }));
}
