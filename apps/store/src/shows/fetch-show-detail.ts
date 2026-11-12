import type { ApiClient, components } from '@openrun/api-client';

export type ShowDetail = components['schemas']['ShowDetailDto'];

// openapi-fetch의 응답 그대로다. 없는 공연(404)을 오류가 아닌 화면으로 바꿔야 해서 unwrap하지 않고,
// 성공과 오류를 함께 selectShowDetail에 넘긴다.
export type ShowDetailResult = Awaited<ReturnType<typeof fetchShowDetail>>;

export async function fetchShowDetail({
  client,
  id,
}: {
  client: ApiClient;
  id: number;
}) {
  return client.GET('/shows/{id}', { params: { path: { id } } });
}
