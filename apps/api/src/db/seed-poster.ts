import { createRequire } from 'node:module';
import sharp from 'sharp';
import type { Genre } from './schema/shows.js';

// 시드가 공연마다 만드는 가상의 포스터다. 실제 공연 포스터는 쓰지 않는다.
// 실제 공연 포스터처럼 위쪽에 큰 그림(키 비주얼)을 두고, 아래쪽에 제목과 공연 기간, 공연장을 적는다.
// 그림은 SVG로 그리고, 글자는 sharp의 text 입력으로 따로 그려 위에 얹는다.
// SVG 안의 <text>는 시스템 글꼴(fontconfig)에 기대므로, 한글 글꼴이 없는 환경에서도 같게 나오도록 글꼴 파일을 직접 지정한다.

// 3:4 비율. 카드에서 가장 넓게 그려지는 폭(데스크톱 4열 약 280px)의 2배 밀도를 덮는다.
const WIDTH = 600;
const HEIGHT = 800;
const PADDING = 44;
const TEXT_WIDTH = WIDTH - PADDING * 2;

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

interface Palette {
  // 배경 그라데이션의 위, 아래 색
  top: string;
  bottom: string;
  // 키 비주얼의 강조색
  accent: string;
}

interface GenreStyle {
  // 포스터 위쪽에 작게 적는 영문 장르 이름
  label: string;
  // 같은 장르의 공연도 서로 달라 보이도록 공연 순번으로 고른다.
  palettes: readonly [Palette, ...Palette[]];
  // 위쪽 약 60%를 채우는 그림. 강조색을 받아 SVG 조각을 돌려준다.
  keyVisual: (accent: string) => string;
}

// 무대 조명 세 줄기와 바닥에 맺힌 조명
function spotlights(accent: string): string {
  return `
  <defs>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="pool">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.7"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <polygon points="90,0 130,0 330,470 230,470" fill="url(#beam)" opacity="0.55"/>
  <polygon points="280,0 320,0 360,470 240,470" fill="url(#beam)" opacity="0.8"/>
  <polygon points="470,0 510,0 370,470 270,470" fill="url(#beam)" opacity="0.55"/>
  <ellipse cx="300" cy="470" rx="200" ry="44" fill="url(#pool)"/>
  <circle cx="300" cy="300" r="70" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="3"/>
  <circle cx="300" cy="300" r="58" fill="${accent}" opacity="0.9"/>
  ${stars([
    [70, 120, 3],
    [520, 90, 4],
    [460, 220, 2],
    [120, 300, 2],
    [540, 360, 3],
  ])}`;
}

// 반쯤 열린 문과 그 앞으로 길게 드리운 빛
function door(accent: string): string {
  return `
  <polygon points="250,140 350,140 560,520 40,520" fill="${accent}" opacity="0.18"/>
  <rect x="250" y="140" width="100" height="200" fill="${accent}" opacity="0.95"/>
  <polygon points="350,140 410,120 410,360 350,340" fill="#000" opacity="0.45"/>
  <rect x="236" y="126" width="128" height="228" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="3"/>
  <circle cx="300" cy="300" r="10" fill="#000" opacity="0.6"/>
  <ellipse cx="300" cy="288" rx="10" ry="18" fill="#000" opacity="0.6"/>
  <line x1="0" y1="520" x2="600" y2="520" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/>`;
}

// 퍼져 나가는 소리 고리와 이퀄라이저 막대
function soundRings(accent: string): string {
  const rings = [60, 110, 160, 210, 260]
    .map(
      (r, i) =>
        `<circle cx="300" cy="270" r="${r}" fill="none" stroke="${i % 2 === 0 ? accent : '#fff'}" stroke-opacity="${0.9 - i * 0.15}" stroke-width="${10 - i * 1.5}"/>`,
    )
    .join('');
  const bars = [40, 90, 60, 130, 80, 150, 100, 70, 120, 50, 90, 40]
    .map(
      (h, i) =>
        `<rect x="${78 + i * 38}" y="${520 - h}" width="20" height="${h}" rx="4" fill="${accent}" opacity="0.85"/>`,
    )
    .join('');
  return `${rings}<circle cx="300" cy="270" r="26" fill="#fff"/>${bars}`;
}

// 큰 달과 흐르는 비단 띠
function moonAndRibbons(accent: string): string {
  const ribbons = [0, 1, 2, 3]
    .map(
      (i) =>
        `<path d="M-20 ${360 + i * 36} C 140 ${280 + i * 36}, 300 ${470 + i * 36}, 620 ${330 + i * 36}" fill="none" stroke="${i % 2 === 0 ? accent : '#fff'}" stroke-opacity="${0.85 - i * 0.15}" stroke-width="${6 - i}"/>`,
    )
    .join('');
  return `
  <defs><clipPath id="moon"><circle cx="390" cy="200" r="120"/></clipPath></defs>
  <circle cx="390" cy="200" r="120" fill="${accent}" opacity="0.92"/>
  <circle cx="440" cy="170" r="120" fill="#000" opacity="0.25" clip-path="url(#moon)"/>
  ${ribbons}
  ${stars([
    [90, 110, 3],
    [180, 60, 2],
    [140, 230, 2],
  ])}`;
}

// 햇살과 언덕, 별
function sunAndHills(accent: string): string {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI) / 6;
    const x1 = 300 + Math.cos(angle) * 120;
    const y1 = 240 + Math.sin(angle) * 120;
    const x2 = 300 + Math.cos(angle) * 170;
    const y2 = 240 + Math.sin(angle) * 170;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-opacity="0.85"/>`;
  }).join('');
  return `
  ${rays}
  <circle cx="300" cy="240" r="96" fill="${accent}"/>
  <path d="M-10 520 Q 150 400 310 500 T 620 470 V 800 H -10 Z" fill="#fff" opacity="0.25"/>
  <path d="M-10 540 Q 200 450 400 530 T 620 520 V 800 H -10 Z" fill="${accent}" opacity="0.55"/>
  ${stars([
    [80, 90, 5],
    [520, 120, 4],
    [500, 380, 3],
  ])}`;
}

function stars(points: [x: number, y: number, r: number][]): string {
  return points
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="0.85"/>`,
    )
    .join('');
}

const GENRE_STYLES = {
  musical: {
    label: 'MUSICAL',
    palettes: [
      { top: '#2a0a1a', bottom: '#7a1838', accent: '#ffcf5c' },
      { top: '#120b2e', bottom: '#5b1a5e', accent: '#ff9ec7' },
    ],
    keyVisual: spotlights,
  },
  play: {
    label: 'PLAY',
    palettes: [
      { top: '#0d1f26', bottom: '#1f5160', accent: '#f4e3b5' },
      { top: '#1c1712', bottom: '#4a3b2a', accent: '#f6c177' },
    ],
    keyVisual: door,
  },
  concert: {
    label: 'CONCERT',
    palettes: [
      { top: '#0b0620', bottom: '#3d2275', accent: '#5ce1e6' },
      { top: '#06141f', bottom: '#0f4c5c', accent: '#ff6b9a' },
    ],
    keyVisual: soundRings,
  },
  classical_dance: {
    label: 'CLASSIC & DANCE',
    palettes: [
      { top: '#070d24', bottom: '#1d2d5c', accent: '#f1e4c3' },
      { top: '#1a0f1f', bottom: '#4b2c4f', accent: '#e8c4d8' },
    ],
    keyVisual: moonAndRibbons,
  },
  kids_family: {
    label: 'KIDS & FAMILY',
    palettes: [
      { top: '#ff9a3c', bottom: '#d4561a', accent: '#ffe066' },
      { top: '#4cb8c4', bottom: '#2a7f9e', accent: '#ffd23f' },
    ],
    keyVisual: sunAndHills,
  },
} satisfies Record<Genre, GenreStyle>;

function backgroundSvg({
  style,
  palette,
  mirrored,
}: {
  style: GenreStyle;
  palette: Palette;
  mirrored: boolean;
}): string {
  // 순번이 홀수인 공연은 그림을 좌우로 뒤집어, 같은 장르와 색이어도 구도가 달라 보이게 한다.
  const flip = mirrored ? ` transform="translate(${WIDTH} 0) scale(-1 1)"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${palette.top}"/>
      <stop offset="1" stop-color="${palette.bottom}"/>
    </linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g${flip}>${style.keyVisual(palette.accent)}</g>
  <rect width="100%" height="100%" fill="url(#shade)"/>
  <rect x="20" y="20" width="${WIDTH - 40}" height="${HEIGHT - 40}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5"/>
  <line x1="${PADDING}" y1="672" x2="${WIDTH - PADDING}" y2="672" stroke="#fff" stroke-opacity="0.5" stroke-width="1"/>
</svg>`;
}

// Pango 마크업으로 글자색과 자간을 정하므로 마크업 특수 문자를 이스케이프한다.
function escapeMarkup(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

// 글자 크기(px)를 고정해 공연마다 제목 크기가 같다. 폭을 넘으면 단어 단위로 줄을 바꾼다.
async function textImage(
  text: string,
  {
    font,
    size,
    opacity = 100,
    letterSpacing = 0,
  }: {
    font: keyof typeof FONTS;
    size: number;
    opacity?: number;
    letterSpacing?: number;
  },
) {
  const { family, file } = FONTS[font];
  return sharp({
    text: {
      // letter_spacing은 1/1024pt 단위다.
      text: `<span foreground="#ffffff" alpha="${opacity}%" letter_spacing="${letterSpacing * 1024}">${escapeMarkup(text)}</span>`,
      font: `${family} ${size}`,
      fontfile: file,
      width: TEXT_WIDTH,
      dpi: 72,
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
  venueName,
  period,
  variant,
}: {
  title: string;
  genre: Genre;
  venueName: string;
  /** 포스터에 적을 공연 기간. 예: `2026.11.07 – 2026.12.11` */
  period: string;
  /** 같은 장르의 공연끼리 색과 구도를 바꾸는 순번 */
  variant: number;
}): Promise<Buffer> {
  const style: GenreStyle = GENRE_STYLES[genre];
  const palette =
    style.palettes[variant % style.palettes.length] ?? style.palettes[0];

  const [label, heading, periodText, venueText] = await Promise.all([
    textImage(style.label, {
      font: 'medium',
      size: 15,
      opacity: 85,
      letterSpacing: 4,
    }),
    textImage(title, { font: 'bold', size: 52 }),
    textImage(period, { font: 'medium', size: 20, opacity: 90 }),
    textImage(venueName, { font: 'medium', size: 20, opacity: 75 }),
  ]);

  // 아래부터 쌓는다: 공연장, 공연 기간, 구분선(SVG), 제목
  const venueTop = HEIGHT - PADDING - venueText.info.height;
  const periodTop = venueTop - 6 - periodText.info.height;
  const headingTop = 672 - 20 - heading.info.height;

  return sharp(
    Buffer.from(backgroundSvg({ style, palette, mirrored: variant % 2 === 1 })),
  )
    .composite([
      { input: label.data, left: PADDING, top: PADDING },
      { input: heading.data, left: PADDING, top: headingTop },
      { input: periodText.data, left: PADDING, top: periodTop },
      { input: venueText.data, left: PADDING, top: venueTop },
    ])
    .png()
    .toBuffer();
}
