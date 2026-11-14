import type { Metadata } from 'next';
import {
  getShowDetailMetadata,
  ShowDetailPage,
} from '@apps-src/shows/[id]/show-detail-page';

export async function generateMetadata({
  params,
}: PageProps<'/shows/[id]'>): Promise<Metadata> {
  return getShowDetailMetadata((await params).id);
}

export default async function Page({ params }: PageProps<'/shows/[id]'>) {
  return <ShowDetailPage id={(await params).id} />;
}
