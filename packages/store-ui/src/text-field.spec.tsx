import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TextField } from './text-field.js';

// 서버 렌더링 결과 HTML만 본다. 입력과 포커스 같은 브라우저 동작은 Base UI가 맡고, Storybook에서 확인한다.

function attr(tag: string, { name }: { name: string }) {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

function tagOf(html: string, { tag }: { tag: string }) {
  const found = new RegExp(`<${tag}\\b[^>]*>`).exec(html)?.[0];
  if (!found) throw new Error(`<${tag}>가 없다:\n${html}`);
  return found;
}

describe('TextField', () => {
  it('라벨이 입력 칸을 가리켜 라벨을 누르거나 읽으면 입력 칸으로 연결된다', () => {
    const html = renderToStaticMarkup(<TextField label="공연 제목" />);

    const label = tagOf(html, { tag: 'label' });
    const input = tagOf(html, { tag: 'input' });
    expect(attr(input, { name: 'id' })).toBeTruthy();
    expect(attr(label, { name: 'for' })).toBe(attr(input, { name: 'id' }));
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

    const input = tagOf(html, { tag: 'input' });
    expect(attr(input, { name: 'name' })).toBe('q');
    expect(attr(input, { name: 'type' })).toBe('search');
    expect(attr(input, { name: 'placeholder' })).toBe('제목으로 찾기');
    expect(attr(input, { name: 'value' })).toBe('햄릿');
  });

  it('비활성이면 입력 칸이 disabled다', () => {
    const html = renderToStaticMarkup(<TextField label="공연 제목" disabled />);

    expect(tagOf(html, { tag: 'input' })).toMatch(/\sdisabled=""/);
  });
});
