import { createRequire } from 'node:module';
import sharp from 'sharp';

// 시드가 그리는 이미지(포스터, 상세 이미지)에 글자를 그린다.
// SVG 안의 <text>는 시스템 글꼴(fontconfig)에 기대므로, 한글 글꼴이 없는 환경에서도 같게 나오도록 글꼴 파일을 직접 지정한다.

const requireFromHere = createRequire(import.meta.url);
const FONTS = {
  bold: {
    family: 'Pretendard Bold',
    file: requireFromHere.resolve(
      'pretendard/dist/public/static/Pretendard-Bold.otf',
    ),
  },
  medium: {
    family: 'Pretendard Medium',
    file: requireFromHere.resolve(
      'pretendard/dist/public/static/Pretendard-Medium.otf',
    ),
  },
};

// Pango는 한글 음절 사이를 모두 줄바꿈할 수 있는 자리로 봐서 "약속"이 "약/속"으로 갈린다.
// 공백이 아닌 글자 사이마다 줄바꿈을 막는 WORD JOINER(U+2060, 폭 없음)를 넣어 공백에서만 줄을 바꾼다(CSS의 word-break: keep-all).
function keepWords(text: string): string {
  return text.replace(/(\S)(?=\S)/gu, '$1\u2060');
}

// Pango 마크업으로 글자색과 자간을 정하므로 마크업 특수 문자를 이스케이프한다.
function escapeMarkup(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

// 글자 크기(px)를 고정해 이미지마다 같은 크기로 그린다. 폭을 넘으면 공백에서 줄을 바꾼다.
// 돌려주는 info.height로 다음 글자를 놓을 자리를 정한다.
export async function renderTextImage(
  text: string,
  {
    font,
    size,
    width,
    color = '#ffffff',
    opacity = 100,
    letterSpacing = 0,
    lineSpacing,
  }: {
    font: keyof typeof FONTS;
    size: number;
    width: number;
    color?: string;
    opacity?: number;
    letterSpacing?: number;
    /** 줄 사이 간격(px). 없으면 글꼴의 기본 줄 높이를 쓴다. */
    lineSpacing?: number;
  },
) {
  const { family, file } = FONTS[font];
  return sharp({
    text: {
      // letter_spacing은 1/1024pt 단위다.
      text: `<span foreground="${color}" alpha="${opacity}%" letter_spacing="${letterSpacing * 1024}">${escapeMarkup(keepWords(text))}</span>`,
      font: `${family} ${size}`,
      fontfile: file,
      width,
      dpi: 72,
      rgba: true,
      wrap: 'word',
      ...(lineSpacing === undefined ? {} : { spacing: lineSpacing }),
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
}
