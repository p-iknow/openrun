import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getPagination, Pagination } from './pagination.js';

// 서버 렌더링 결과 HTML만 본다. DOM 테스트 환경 없이 서버에서 그려지는지도 함께 확인된다.

// 쓰는 쪽(1.3의 목록 화면)이 조립하는 모습. 주소는 쓰는 쪽이 정한다.
function ShowsPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const { pages, previousPage, nextPage, hasPreviousPage, hasNextPage } =
    getPagination({ currentPage, totalPages });
  const href = (page: number) => `/shows?page=${page}`;
  return (
    <Pagination.Root>
      <Pagination.Previous
        disabled={!hasPreviousPage}
        render={<a href={href(previousPage)} />}
      />
      {pages.map((page) => (
        <Pagination.Link
          key={page}
          current={page === currentPage}
          render={<a href={href(page)} />}
        >
          {page}
        </Pagination.Link>
      ))}
      <Pagination.Next
        disabled={!hasNextPage}
        render={<a href={href(nextPage)} />}
      />
    </Pagination.Root>
  );
}

interface Anchor {
  text: string;
  href: string | undefined;
  attrs: string;
}

function anchors(html: string): Anchor[] {
  return [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g)].map((match) => {
    const attrs = match[1] ?? '';
    const inner = match[2] ?? '';
    return {
      attrs,
      href: /\shref="([^"]*)"/.exec(attrs)?.[1],
      // 아이콘 같은 태그를 지우고 보이는 글자와 aria-label을 이름으로 쓴다.
      text:
        /\saria-label="([^"]*)"/.exec(attrs)?.[1] ??
        inner.replaceAll(/<[^>]*>/g, ''),
    };
  });
}

function find(html: string, { text }: { text: string }) {
  const found = anchors(html).find((a) => a.text === text);
  if (!found) throw new Error(`"${text}" 링크가 없다:\n${html}`);
  return found;
}

function pageNumbers(html: string) {
  return anchors(html)
    .map((a) => a.text)
    .filter((text) => /^\d+$/.test(text));
}

// 비활성 링크는 갈 곳이 없으므로 href가 없고, 스크린 리더에 비활성임을 알린다.
function isDisabled(anchor: Anchor) {
  return (
    anchor.href === undefined && anchor.attrs.includes('aria-disabled="true"')
  );
}

describe('Pagination', () => {
  it('페이지 번호는 쓰는 쪽이 render로 넘긴 링크로 나온다', () => {
    const html = renderToStaticMarkup(
      <ShowsPagination currentPage={2} totalPages={3} />,
    );

    expect(find(html, { text: '1' }).href).toBe('/shows?page=1');
    expect(find(html, { text: '3' }).href).toBe('/shows?page=3');
  });

  it('render로 넘긴 컴포넌트에 그대로 그리고, 쓰는 쪽의 속성을 지킨다', () => {
    // Next의 Link 같은 라우터 링크를 흉내 낸다.
    function RouterLink(props: ComponentProps<'a'>) {
      return <a data-router="" {...props} />;
    }
    const html = renderToStaticMarkup(
      <Pagination.Link current render={<RouterLink href="/shows?page=4" />}>
        4
      </Pagination.Link>,
    );

    const link = find(html, { text: '4' });
    expect(link.attrs).toContain('data-router=""');
    expect(link.href).toBe('/shows?page=4');
    expect(link.attrs).toContain('aria-current="page"');
  });

  it('현재 페이지에만 aria-current="page"를 붙인다', () => {
    const html = renderToStaticMarkup(
      <ShowsPagination currentPage={2} totalPages={3} />,
    );

    const current = anchors(html).filter((a) =>
      a.attrs.includes('aria-current="page"'),
    );
    expect(current.map((a) => a.text)).toEqual(['2']);
  });

  it('첫 페이지에서는 이전이 비활성이고 다음은 2페이지로 간다', () => {
    const html = renderToStaticMarkup(
      <ShowsPagination currentPage={1} totalPages={3} />,
    );

    expect(isDisabled(find(html, { text: '이전 페이지' }))).toBe(true);
    expect(find(html, { text: '다음 페이지' }).href).toBe('/shows?page=2');
  });

  it('마지막 페이지에서는 다음이 비활성이고 이전은 앞 페이지로 간다', () => {
    const html = renderToStaticMarkup(
      <ShowsPagination currentPage={3} totalPages={3} />,
    );

    expect(isDisabled(find(html, { text: '다음 페이지' }))).toBe(true);
    expect(find(html, { text: '이전 페이지' }).href).toBe('/shows?page=2');
  });

  it('전체 페이지가 1이면 이전과 다음이 모두 비활성이다', () => {
    const html = renderToStaticMarkup(
      <ShowsPagination currentPage={1} totalPages={1} />,
    );

    expect(isDisabled(find(html, { text: '이전 페이지' }))).toBe(true);
    expect(isDisabled(find(html, { text: '다음 페이지' }))).toBe(true);
    expect(pageNumbers(html)).toEqual(['1']);
  });

  // 현재 페이지를 가운데에 두고, 끝에 닿으면 반대쪽으로 채워 늘 5개를 맞춘다.
  it.each([
    { currentPage: 1, expected: ['1', '2', '3', '4', '5'] },
    { currentPage: 2, expected: ['1', '2', '3', '4', '5'] },
    { currentPage: 5, expected: ['3', '4', '5', '6', '7'] },
    { currentPage: 9, expected: ['6', '7', '8', '9', '10'] },
    { currentPage: 10, expected: ['6', '7', '8', '9', '10'] },
  ])(
    '전체 10페이지, 현재 $currentPage: 번호 $expected',
    ({ currentPage, expected }) => {
      const html = renderToStaticMarkup(
        <ShowsPagination currentPage={currentPage} totalPages={10} />,
      );

      expect(pageNumbers(html)).toEqual(expected);
    },
  );

  it('전체 페이지가 5개 이하면 모든 번호를 보여 준다', () => {
    const html = renderToStaticMarkup(
      <ShowsPagination currentPage={2} totalPages={4} />,
    );

    expect(pageNumbers(html)).toEqual(['1', '2', '3', '4']);
  });
});
