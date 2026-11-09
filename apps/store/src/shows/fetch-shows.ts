import type { ApiClient, components } from '@openrun/api-client';
import { selectData } from '../select-data';

export type Show = components['schemas']['ShowDto'];

export async function fetchShows(client: ApiClient): Promise<Show[]> {
  return selectData(await client.GET('/shows'));
}
