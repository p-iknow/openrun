import { createRequire } from 'node:module';
import sharp from 'sharp';
import type { Genre } from './schema/shows.js';

// 시드가 공연마다 만드는 가상의 포스터다. 실제 공연 포스터는 쓰지 않는다.
// 배경(장르별 색과 무늬)은 SVG로 그리고, 글자는 sharp의 text 입력으로 따로 그려 위에 얹는다.
// SVG 안의 <text>는 시스템 글꼴(fontconfig)에 기대므로, 한글 글꼴이 없는 환경에서도 같게 나오도록 글꼴 파일을 직접 지정한다.

// 3:4 비율. 카드에서 가장 넓게 그려지는 폭(데스크톱 4열 약 280px)의 2배 밀도를 덮는다.
const WIDTH = 600;
const HEIGHT = 800;
const PADDING = 48;

const FONT_FILE = createRequire(import.meta.url).resolve(
  'pretendard/dist/public/static/Pretendard-Bold.otf',
);
const FONT = 'Pretendard Bold';

interface GenreStyle {
  label: string;
  background: string;
  // SVG <pattern> 안에 들어갈 무늬. 흰색으로 그리고 배경 위에 반투명하게 얹는다.
  pattern: { size: number; transform?: string; shape: string };
}

const GENRE_STYLES = {
  musical: {
    label: '뮤지컬',
    background: '#8a1c3c',
    pattern: {
      size: 120,
      shape:
        '<circle cx="60" cy="60" r="40" fill="none" stroke="#fff" stroke-width="6"/>',
    },
  },
  play: {
    label: '연극',
    background: '#1f5160',
    pattern: {
      size: 32,
      transform: 'rotate(45)',
      shape: '<rect width="12" height="32" fill="#fff"/>',
    },
  },
  concert: {
    label: '콘서트',
    background: '#3d2275',
    pattern: {
      size: 40,
      shape: '<circle cx="20" cy="20" r="6" fill="#fff"/>',
    },
  },
  classical_dance: {
    label: '클래식·무용',
    background: '#1d2d5c',
    pattern: {
      size: 80,
      shape:
        '<path d="M0 40 Q20 20 40 40 T80 40" fill="none" stroke="#fff" stroke-width="5"/>',
    },
  },
  kids_family: {
    label: '아동·가족',
    background: '#d4651a',
    pattern: {
      size: 60,
      shape:
        '<path d="M0 45 L15 15 L30 45 L45 15 L60 45" fill="none" stroke="#fff" stroke-width="6"/>',
    },
  },
} satisfies Record<Genre, GenreStyle>;

function backgroundSvg({ background, pattern }: GenreStyle): string {
  const transform = pattern.transform
    ? ` patternTransform="${pattern.transform}"`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <pattern id="motif" width="${pattern.size}" height="${pattern.size}" patternUnits="userSpaceOnUse"${transform}>${pattern.shape}</pattern>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${background}"/>
  <rect width="100%" height="100%" fill="url(#motif)" opacity="0.18"/>
  <rect width="100%" height="100%" fill="url(#shade)"/>
</svg>`;
}

// Pango 마크업으로 글자색을 정하므로 마크업 특수 문자를 이스케이프한다.
function escapeMarkup(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

// width와 height를 함께 주면 sharp가 글자 크기를 그 상자에 맞춘다.
async function textImage(
  text: string,
  { width, height }: { width: number; height: number },
) {
  return sharp({
    text: {
      text: `<span foreground="#ffffff">${escapeMarkup(text)}</span>`,
      font: FONT,
      fontfile: FONT_FILE,
      width,
      height,
      rgba: true,
      wrap: 'word',
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
}

export async function renderPoster({
  title,
  genre,
}: {
  title: string;
  genre: Genre;
}): Promise<Buffer> {
  const style = GENRE_STYLES[genre];
  const [label, heading] = await Promise.all([
    textImage(style.label, { width: WIDTH - PADDING * 2, height: 36 }),
    // 글자 크기를 상자에 맞추면 단어 중간에서 줄이 바뀔 수 있어, 단어마다 줄을 나눈다.
    textImage(title.split(' ').join('\n'), {
      width: WIDTH - PADDING * 2,
      height: 300,
    }),
  ]);

  return sharp(Buffer.from(backgroundSvg(style)))
    .composite([
      { input: label.data, left: PADDING, top: PADDING },
      {
        input: heading.data,
        left: PADDING,
        top: HEIGHT - PADDING - heading.info.height,
      },
    ])
    .png()
    .toBuffer();
}
