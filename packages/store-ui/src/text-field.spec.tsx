import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TextField } from './text-field.js';

// 서버 렌더링 결과 HTML만 본다. 입력과 포커스 같은 브라우저 동작은 Base UI가 맡고, Storybook에서 확인한다.

function getAttr({ tag, attribute }: { tag: string; attribute: string }) {
  return new RegExp(`\\s${attribute}="([^"]*)"`).exec(tag)?.[1];
}

function findTag({ html, tag }: { html: string; tag: string }) {
  const found = new RegExp(`<${tag}\\b[^>]*>`).exec(html)?.[0];
  if (!found) throw new Error(`<${tag}>가 없다:\n${html}`);
  return found;
}

describe('TextField', () => {
  it('라벨이 입력 칸을 가리켜 라벨을 누르거나 읽으면 입력 칸으로 연결된다', () => {
    const html = renderToStaticMarkup(<TextField label="공연 제목" />);

    const label = findTag({ html, tag: 'label' });
    const input = findTag({ html, tag: 'input' });
    expect(getAttr({ tag: input, attribute: 'id' })).toBeTruthy();
    expect(getAttr({ tag: label, attribute: 'for' })).toBe(
      getAttr({ tag: input, attribute: 'id' }),
    );
    expect(html).toContain('>공연 제목</label>');
  });

  it('name, type, placeholder, defaultValue를 입력 칸에 그대로 넘긴다', () => {
    const html = renderToStaticMarkup(
      <TextField
        label="공연 제목"
        name="q"
        type="search"
        placeholder="제목으로 찾기"
        defaultValue="햄릿"
      />,
    );

    const input = findTag({ html, tag: 'input' });
    expect(getAttr({ tag: input, attribute: 'name' })).toBe('q');
    expect(getAttr({ tag: input, attribute: 'type' })).toBe('search');
    expect(getAttr({ tag: input, attribute: 'placeholder' })).toBe(
      '제목으로 찾기',
    );
    expect(getAttr({ tag: input, attribute: 'value' })).toBe('햄릿');
  });

  it('비활성이면 입력 칸이 disabled다', () => {
    const html = renderToStaticMarkup(<TextField label="공연 제목" disabled />);

    expect(findTag({ html, tag: 'input' })).toMatch(/\sdisabled=""/);
  });
});
