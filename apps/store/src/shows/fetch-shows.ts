import type { ApiClient, components } from '@openrun/api-client';
import { unwrap } from '../unwrap';
import { SHOW_PAGE_SIZE, type ShowListQuery } from './show-list-query';

export type ShowPage = components['schemas']['ShowPageDto'];

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
