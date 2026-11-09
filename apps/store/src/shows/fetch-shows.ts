import type { ApiClient, components } from '@openrun/api-client';
import { unwrap } from '../unwrap';

export type Show = components['schemas']['ShowDto'];

export async function fetchShows(client: ApiClient): Promise<Show[]> {
  return unwrap(await client.GET('/shows'));
}
