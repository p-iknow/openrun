import type { ApiClient, components } from '@openrun/api-client';
import { unwrap } from '../unwrap';

export type ShowPage = components['schemas']['ShowPageDto'];

export async function fetchShows(client: ApiClient): Promise<ShowPage> {
  return unwrap(await client.GET('/shows'));
}
