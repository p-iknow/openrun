import { getPagination, Pagination } from '@openrun/store-ui';
import Link from 'next/link';
import {
  getShowListHref,
  type ShowListQuery,
} from '@shared/feature/show/helper/show-list-query';

// 페이지 링크는 현재 쿼리를 그대로 두고 page만 바꾼다. 링크라서 새 탭으로 열거나 주소를 복사해도 같은 페이지가 나온다.
export function ShowListPagination({
  query,
  totalPages,
}: {
  query: ShowListQuery;
  totalPages: number;
}) {
  const { pages, previousPage, nextPage, hasPreviousPage, hasNextPage } =
    getPagination({ currentPage: query.page, totalPages });
  const href = (page: number) => getShowListHref({ ...query, page });

  return (
    <Pagination.Root>
      <Pagination.Previous
        disabled={!hasPreviousPage}
        render={<Link href={href(previousPage)} />}
      />
      {pages.map(({ page, isActive }) => (
        <Pagination.Link
          key={page}
          page={page}
          active={isActive}
          render={<Link href={href(page)} />}
        />
      ))}
      <Pagination.Next
        disabled={!hasNextPage}
        render={<Link href={href(nextPage)} />}
      />
    </Pagination.Root>
  );
}
