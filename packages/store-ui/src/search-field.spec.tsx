import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SearchField } from './search-field.js';

// 서버 렌더링 결과 HTML만 본다. 입력과 제출 같은 브라우저 동작은 Storybook에서 확인한다.

function attr(tag: string, { attribute }: { attribute: string }) {
  return new RegExp(`\\s${attribute}="([^"]*)"`).exec(tag)?.[1];
}

function tagOf(html: string, { tag }: { tag: string }) {
  const found = new RegExp(`<${tag}\\b[^>]*>`).exec(html)?.[0];
  if (!found) throw new Error(`<${tag}>가 없다:\n${html}`);
  return found;
}

describe('SearchField', () => {
  it('라벨은 화면에서 숨기되 입력 칸에 연결해 접근 가능한 이름으로 남긴다', () => {
    const html = renderToStaticMarkup(<SearchField label="공연 제목 검색" />);

    const label = tagOf(html, { tag: 'label' });
    const input = tagOf(html, { tag: 'input' });
    expect(attr(label, { attribute: 'for' })).toBe(
      attr(input, { attribute: 'id' }),
    );
    expect(attr(label, { attribute: 'class' })).toContain('sr-only');
    expect(html).toContain('>공연 제목 검색</label>');
  });

  it('입력 칸은 search 타입이고 name, placeholder, defaultValue, maxLength를 넘긴다', () => {
    const html = renderToStaticMarkup(
      <SearchField
        label="공연 제목 검색"
        name="q"
        placeholder="공연 제목으로 찾기"
        defaultValue="햄릿"
        maxLength={50}
      />,
    );

    const input = tagOf(html, { tag: 'input' });
    expect(attr(input, { attribute: 'type' })).toBe('search');
    expect(attr(input, { attribute: 'name' })).toBe('q');
    expect(attr(input, { attribute: 'placeholder' })).toBe(
      '공연 제목으로 찾기',
    );
    expect(attr(input, { attribute: 'value' })).toBe('햄릿');
    expect(attr(input, { attribute: 'maxLength' })).toBe('50');
  });

  it('폼을 제출하는 버튼을 두고, 글자 없는 아이콘 버튼이라 이름을 aria-label로 준다', () => {
    const html = renderToStaticMarkup(<SearchField label="공연 제목 검색" />);

    const button = tagOf(html, { tag: 'button' });
    expect(attr(button, { attribute: 'type' })).toBe('submit');
    expect(attr(button, { attribute: 'aria-label' })).toBe('검색');
  });
});
