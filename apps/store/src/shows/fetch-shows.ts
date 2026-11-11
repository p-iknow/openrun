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
      params: { query: { page: query.page, size: SHOW_PAGE_SIZE } },
    }),
  );
}
