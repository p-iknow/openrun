import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Select } from './select.js';

// 서버 렌더링 결과 HTML만 본다. 키보드로 열고 고르는 동작은 Base UI가 맡고, Storybook에서 확인한다.

// 1.3의 정렬 선택이 쓰는 모습.
const sortItems = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'closing', label: '마감 임박순' },
];

function attr({ tag, attribute }: { tag: string; attribute: string }) {
  return new RegExp(`\\s${attribute}="([^"]*)"`).exec(tag)?.[1];
}

function trigger(html: string) {
  const found = /<button\b[^>]*>(.*?)<\/button>/.exec(html);
  if (!found) throw new Error(`트리거 버튼이 없다:\n${html}`);
  return {
    tag: found[0].slice(0, found[0].indexOf('>') + 1),
    // 아이콘 같은 태그를 지우고 보이는 글자만 남긴다.
    text: (found[1] ?? '').replaceAll(/<[^>]*>/g, ''),
  };
}

// 트리거와 라벨의 연결(aria-labelledby)은 Base UI가 라벨 id를 effect에서 등록하므로 하이드레이션 뒤에만 생긴다.
// 서버 HTML로는 확인할 수 없어 Storybook의 접근성 패널에서 확인한다.
describe('Select', () => {
  it('고른 값이 있으면 트리거에 그 항목의 이름을 보인다', () => {
    const html = renderToStaticMarkup(
      <Select label="정렬" items={sortItems} defaultValue="popular" />,
    );

    expect(trigger(html).text).toBe('인기순');
  });

  it('고른 값이 없으면 트리거에 placeholder를 보인다', () => {
    const html = renderToStaticMarkup(
      <Select label="정렬" items={sortItems} placeholder="정렬 기준" />,
    );

    expect(trigger(html).text).toBe('정렬 기준');
  });

  it('폼으로 제출할 수 있도록 name과 고른 값을 숨은 입력에 둔다', () => {
    const html = renderToStaticMarkup(
      <Select
        label="정렬"
        name="sort"
        items={sortItems}
        defaultValue="closing"
      />,
    );

    const input = /<input\b[^>]*>/.exec(html)?.[0] ?? '';
    expect(attr({ tag: input, attribute: 'name' })).toBe('sort');
    expect(attr({ tag: input, attribute: 'value' })).toBe('closing');
  });

  it('inline이면 라벨을 화면에서 숨기고 트리거에는 고른 값만 보인다', () => {
    const html = renderToStaticMarkup(
      <Select
        label="정렬"
        items={sortItems}
        defaultValue="popular"
        variant="inline"
      />,
    );

    const label = /<[a-z]+\b[^>]*>정렬<\/[a-z]+>/.exec(html)?.[0] ?? '';
    expect(attr({ tag: label, attribute: 'class' })).toContain('sr-only');
    expect(trigger(html).text).toBe('인기순');
  });

  it('비활성이면 트리거를 누를 수 없다', () => {
    const html = renderToStaticMarkup(
      <Select label="정렬" items={sortItems} disabled />,
    );

    expect(trigger(html).tag).toMatch(/\sdisabled=""/);
  });
});
