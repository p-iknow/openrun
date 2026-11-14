import type { ApiClient, components } from '@openrun/api-client';
import { SHOW_PAGE_SIZE, type ShowListQuery } from '../shows/show-list-query';
import { unwrap } from './unwrap';

export type ShowPage = components['schemas']['ShowPageDto'];
export type ShowDetail = components['schemas']['ShowDetailDto'];

export async function fetchShows({
  client,
  query,
}: {
  client: ApiClient;
  query: ShowListQuery;
}): Promise<ShowPage> {
  return unwrap(
    await client.GET('/shows', {
      params: {
        query: {
          page: query.page,
          size: SHOW_PAGE_SIZE,
          q: query.q ?? undefined,
          // 배열은 같은 이름을 여러 번 써서 보낸다(genre=musical&genre=play). 빈 배열은 보내지 않는다.
          genre: query.genre,
          status: query.status,
          sort: query.sort,
        },
      },
    }),
  );
}

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
