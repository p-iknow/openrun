import type { Meta, StoryObj } from '@storybook/react-vite';
import { getPagination, Pagination } from './pagination.js';

// 쓰는 쪽이 조립하는 모습을 그대로 보여 준다. 주소 규칙은 쓰는 쪽(여기서는 이 스토리)이 정한다.
function PaginationExample({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const { pages, previousPage, nextPage, hasPreviousPage, hasNextPage } =
    getPagination({ currentPage, totalPages });
  const buildHref = (page: number) => `?page=${page}`;
  return (
    <Pagination.Root>
      <Pagination.Previous
        disabled={!hasPreviousPage}
        render={<a href={buildHref(previousPage)} />}
      />
      {pages.map(({ page, isActive }) => (
        <Pagination.Link
          key={page}
          page={page}
          active={isActive}
          render={<a href={buildHref(page)} />}
        />
      ))}
      <Pagination.Next
        disabled={!hasNextPage}
        render={<a href={buildHref(nextPage)} />}
      />
    </Pagination.Root>
  );
}

const usage = `\`\`\`tsx
const { pages, previousPage, nextPage, hasPreviousPage, hasNextPage } =
  getPagination({ currentPage, totalPages });

<Pagination.Root>
  <Pagination.Previous disabled={!hasPreviousPage} render={<Link href={buildHref(previousPage)} />} />
  {pages.map(({ page, isActive }) => (
    <Pagination.Link key={page} page={page} active={isActive} render={<Link href={buildHref(page)} />} />
  ))}
  <Pagination.Next disabled={!hasNextPage} render={<Link href={buildHref(nextPage)} />} />
</Pagination.Root>
\`\`\``;

const meta = {
  title: 'Components/Pagination',
  component: PaginationExample,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `**서버용** 컴포넌트다. Server Component에서 바로 import한다. Base UI처럼 \`Pagination.Root\` 안에 \`Pagination.Previous\`, \`Pagination.Link\`, \`Pagination.Next\`를 조립한다. 모양과 접근성 속성만 맡고, 링크는 쓰는 쪽이 Base UI처럼 \`render\`로 넘긴다. 그래서 \`<a>\`를 쓸지 Next.js의 \`Link\`를 쓸지, 주소를 어떻게 만들지(\`?page=\`, 필터 유지 등)는 쓰는 쪽이 정한다. \`getPagination\`은 현재 페이지 주변 최대 5개 번호와 이전·다음 페이지를 계산만 한다. 현재 페이지는 \`primary\`로 채우고 \`aria-current="page"\`를 붙인다. 번호 링크의 이름은 "3페이지"이고, \`render\` 요소에 \`aria-label\`을 주면 바꿀 수 있다. 상태는 \`data-active\`, \`data-disabled\`로도 드러나므로 쓰는 쪽이 그 속성으로 스타일을 덧댈 수 있다. 이전·다음은 \`disabled\`이면 \`render\` 대신 비활성 링크를 그린다. Storybook 안에서 링크를 누르면 실제로 주소가 바뀌므로 모양만 확인한다.\n\n${usage}`,
      },
    },
  },
} satisfies Meta<typeof PaginationExample>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 첫 페이지. 이전이 비활성이다. */
export const First: Story = { args: { currentPage: 1, totalPages: 10 } };

/** 중간 페이지. 현재 페이지를 가운데에 두고 앞뒤로 2개씩 보여 준다. */
export const Middle: Story = { args: { currentPage: 5, totalPages: 10 } };

/** 마지막 페이지. 다음이 비활성이다. */
export const Last: Story = { args: { currentPage: 10, totalPages: 10 } };

/** 전체가 1페이지. 이전과 다음이 모두 비활성이다. */
export const SinglePage: Story = { args: { currentPage: 1, totalPages: 1 } };
