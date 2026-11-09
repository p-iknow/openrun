import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Pagination, type PaginationProps } from './pagination.js';

// 서버 렌더링 결과 HTML만 본다. DOM 테스트 환경 없이 서버에서 그려지는지도 함께 확인된다.
function render(props: PaginationProps) {
  return renderToStaticMarkup(<Pagination {...props} />);
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
      href: /\shref="([^"]*)"/.exec(attrs)?.[1]?.replaceAll('&amp;', '&'),
      // 아이콘 같은 태그를 지우고 보이는 글자와 aria-label을 이름으로 쓴다.
      text:
        /\saria-label="([^"]*)"/.exec(attrs)?.[1] ??
        inner.replaceAll(/<[^>]*>/g, ''),
    };
  });
}

function pageNumbers(html: string) {
  return anchors(html)
    .map((a) => a.text)
    .filter((text) => /^\d+$/.test(text));
}

function find(html: string, { text }: { text: string }) {
  const found = anchors(html).find((a) => a.text === text);
  if (!found) throw new Error(`"${text}" 링크가 없다:\n${html}`);
  return found;
}

describe('Pagination', () => {
  it('페이지 번호를 기본 주소와 쿼리 이름으로 만든 링크로 보여 준다', () => {
    const html = render({ currentPage: 2, totalPages: 3, baseUrl: '/shows' });

    expect(find(html, { text: '1' }).href).toBe('/shows?page=1');
    expect(find(html, { text: '3' }).href).toBe('/shows?page=3');
  });

  it('쿼리 이름을 바꾸고 기본 주소에 있던 쿼리는 유지한다', () => {
    const html = render({
      currentPage: 1,
      totalPages: 2,
      baseUrl: '/shows?genre=musical&page=9',
      queryName: 'p',
    });

    expect(find(html, { text: '2' }).href).toBe(
      '/shows?genre=musical&page=9&p=2',
    );
  });

  it('기본 주소에 같은 이름의 쿼리가 있으면 페이지 값으로 바꾼다', () => {
    const html = render({
      currentPage: 1,
      totalPages: 2,
      baseUrl: '/shows?page=9&genre=musical',
    });

    expect(find(html, { text: '2' }).href).toBe('/shows?page=2&genre=musical');
  });

  it('현재 페이지에만 aria-current="page"를 붙인다', () => {
    const html = render({ currentPage: 2, totalPages: 3, baseUrl: '/shows' });

    const current = anchors(html).filter((a) =>
      a.attrs.includes('aria-current="page"'),
    );
    expect(current.map((a) => a.text)).toEqual(['2']);
  });

  it('첫 페이지에서는 이전이 비활성이고 다음은 2페이지로 간다', () => {
    const html = render({ currentPage: 1, totalPages: 3, baseUrl: '/shows' });

    expect(isDisabled(find(html, { text: '이전 페이지' }))).toBe(true);
    expect(find(html, { text: '다음 페이지' }).href).toBe('/shows?page=2');
  });

  it('마지막 페이지에서는 다음이 비활성이고 이전은 앞 페이지로 간다', () => {
    const html = render({ currentPage: 3, totalPages: 3, baseUrl: '/shows' });

    expect(isDisabled(find(html, { text: '다음 페이지' }))).toBe(true);
    expect(find(html, { text: '이전 페이지' }).href).toBe('/shows?page=2');
  });

  it('전체 페이지가 1이면 이전과 다음이 모두 비활성이다', () => {
    const html = render({ currentPage: 1, totalPages: 1, baseUrl: '/shows' });

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
      const html = render({ currentPage, totalPages: 10, baseUrl: '/shows' });

      expect(pageNumbers(html)).toEqual(expected);
    },
  );

  it('전체 페이지가 5개 이하면 모든 번호를 보여 준다', () => {
    const html = render({ currentPage: 2, totalPages: 4, baseUrl: '/shows' });

    expect(pageNumbers(html)).toEqual(['1', '2', '3', '4']);
  });
});

// 비활성 링크는 갈 곳이 없으므로 href가 없고, 스크린 리더에 비활성임을 알린다.
function isDisabled(anchor: Anchor) {
  return (
    anchor.href === undefined && anchor.attrs.includes('aria-disabled="true"')
  );
}
