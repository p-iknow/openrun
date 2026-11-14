import { IndexPage } from '@apps-src/_index/index-page';

export default async function Page({ searchParams }: PageProps<'/'>) {
  return <IndexPage searchParams={await searchParams} />;
}
