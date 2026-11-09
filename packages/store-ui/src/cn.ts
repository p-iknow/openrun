import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tokens.css의 `@theme`에서 Tailwind 기본값을 지우고 의미 이름만 노출했으므로 tailwind-merge에도 그 이름을 알려 준다.
// 알려 주지 않으면 `text-caption`(글자 크기)을 글자색으로 보고 `text-text`와 합칠 때 지운다.
// tokens.css에 토큰을 추가하면 여기에도 추가한다. 글자 크기, 간격, 모서리는 빠뜨리면 cn.spec.ts가 실패한다.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['caption', 'body-sm', 'body', 'title', 'heading', 'display'],
      spacing: ['0', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
      radius: ['badge', 'card', 'button', 'panel'],
      shadow: ['floating'],
      container: ['content'],
    },
  },
});

/** 조건부 클래스를 이어 붙이고(clsx), 같은 속성의 클래스는 뒤에 온 것만 남긴다(tailwind-merge). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
