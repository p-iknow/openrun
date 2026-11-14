import sharp, { type OverlayOptions } from 'sharp';
import { getShowPalette, type Palette } from './seed-poster.js';
import { buildShowNotices, type SeedShowContent } from './seed-shows.js';
import { renderTextImage } from './seed-text.js';

// 시드가 공연마다 만드는 가상의 상세 이미지다. 실제 예매 서비스의 상품 상세처럼 소개를 세로로 긴 이미지에 그린다.
// 1장: 포스터와 같은 색의 머리말(장르, 제목, 한 줄 소개)과 줄거리(또는 공연 소개)
// 2장: 관람 포인트
// 3장: 티켓 수령 안내와 입장 및 관람 유의사항(buildShowNotices)
// 이미지 속 글은 buildShowDescription이 같은 순서의 글로 옮겨 소개 본문에 넣는다.

// NOL 티켓의 상세 이미지 폭(750~840px)과 비슷하게 둔다. 높이는 글 양에 따라 정해진다.
// 360px 휴대폰에서는 약 0.36배로 줄어 보이므로, 본문 글자를 34px로 두어 화면에서 12px 남짓이 되게 한다.
const WIDTH = 860;
const PADDING = 64;
const TEXT_WIDTH = WIDTH - PADDING * 2;
const TEXT_COLOR = '#1b1c1f';
const SECONDARY_COLOR = '#4e5968';

type TextImage = Awaited<ReturnType<typeof renderTextImage>>;

// 글자 이미지를 위에서부터 쌓을 자리를 정한다. 각 항목 앞에 gap만큼 띄운다.
function stackTextImages({
  items,
  top,
}: {
  items: { image: TextImage; gap: number; left?: number }[];
  top: number;
}): { placements: OverlayOptions[]; bottom: number; tops: number[] } {
  let y = top;
  const tops: number[] = [];
  const placements = items.map(({ image, gap, left = PADDING }) => {
    y += gap;
    tops.push(y);
    const placement = { input: image.data, left, top: y };
    y += image.info.height;
    return placement;
  });
  return { placements, bottom: y, tops };
}

// 제목 앞 굵은 색 막대와 제목. 모든 장이 같은 모양의 제목을 쓴다.
async function renderSectionHeading(text: string) {
  return renderTextImage(text, {
    font: 'bold',
    size: 44,
    width: TEXT_WIDTH - 24,
    color: TEXT_COLOR,
  });
}

function buildHeadingBarSvg({
  top,
  palette,
}: {
  top: number;
  palette: Palette;
}) {
  return `<rect x="${PADDING}" y="${top + 10}" width="10" height="40" rx="5" fill="${palette.bottom}"/>`;
}

async function renderStoryImage({
  content,
  label,
  palette,
}: {
  content: SeedShowContent;
  label: string;
  palette: Palette;
}): Promise<Buffer> {
  const [labelText, titleText, taglineText, heading, ...paragraphs] =
    await Promise.all([
      renderTextImage(label, {
        font: 'medium',
        size: 22,
        width: TEXT_WIDTH,
        opacity: 85,
        // 글자 사이의 WORD JOINER에도 자간이 붙어 실제 간격은 이 값의 두 배다(seed-text.ts).
        letterSpacing: 2,
      }),
      renderTextImage(content.title, {
        font: 'bold',
        size: 76,
        width: TEXT_WIDTH,
      }),
      renderTextImage(content.tagline, {
        font: 'medium',
        size: 36,
        width: TEXT_WIDTH,
        opacity: 90,
        lineSpacing: 14,
      }),
      renderSectionHeading(content.storyHeading),
      ...content.story.map((paragraph) =>
        renderTextImage(paragraph, {
          font: 'medium',
          size: 34,
          width: TEXT_WIDTH,
          color: TEXT_COLOR,
          lineSpacing: 20,
        }),
      ),
    ]);

  const header = stackTextImages({
    items: [
      { image: labelText, gap: 0 },
      { image: titleText, gap: 28 },
      { image: taglineText, gap: 24 },
    ],
    top: 88,
  });
  const headerHeight = header.bottom + 88;
  // 제목과 한 줄 소개 사이의 짧은 강조선
  const taglineRuleY = (header.tops[2] ?? 0) - 12;
  const body = stackTextImages({
    items: [
      { image: heading, gap: 0, left: PADDING + 24 },
      ...paragraphs.map((image) => ({ image, gap: 32 })),
    ],
    top: headerHeight + 80,
  });
  const height = body.bottom + 96;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${palette.top}"/>
      <stop offset="1" stop-color="${palette.bottom}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <rect width="100%" height="${headerHeight}" fill="url(#bg)"/>
  <circle cx="${WIDTH - 120}" cy="120" r="64" fill="${palette.accent}" opacity="0.9"/>
  <circle cx="${WIDTH - 120}" cy="120" r="80" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
  <line x1="${PADDING}" y1="${taglineRuleY}" x2="${PADDING + 64}" y2="${taglineRuleY}" stroke="${palette.accent}" stroke-width="4"/>
  ${buildHeadingBarSvg({ top: body.tops[0] ?? 0, palette })}
</svg>`;

  return sharp(Buffer.from(svg))
    .composite([...header.placements, ...body.placements])
    .png()
    .toBuffer();
}

async function renderHighlightsImage({
  content,
  palette,
}: {
  content: SeedShowContent;
  palette: Palette;
}): Promise<Buffer> {
  const NUMBER_SIZE = 56;
  const ITEM_LEFT = PADDING + NUMBER_SIZE + 20;
  const [heading, footer, ...items] = await Promise.all([
    renderSectionHeading('관람 포인트'),
    renderTextImage(content.title, {
      font: 'medium',
      size: 26,
      width: TEXT_WIDTH,
      color: SECONDARY_COLOR,
    }),
    ...content.highlights.map((item) =>
      renderTextImage(item, {
        font: 'medium',
        size: 34,
        width: WIDTH - ITEM_LEFT - PADDING,
        color: TEXT_COLOR,
        lineSpacing: 16,
      }),
    ),
  ]);
  const numbers = await Promise.all(
    items.map((_, index) =>
      renderTextImage(String(index + 1), {
        font: 'bold',
        size: 28,
        width: NUMBER_SIZE,
      }),
    ),
  );

  const body = stackTextImages({
    items: [
      { image: heading, gap: 0, left: PADDING + 24 },
      ...items.map((image) => ({ image, gap: 36, left: ITEM_LEFT })),
    ],
    top: 96,
  });
  const footerTop = body.bottom + 96;
  const height = footerTop + footer.info.height + 72;

  // 번호 원은 항목 첫 줄의 가운데(위에서 21px)에 맞춘다.
  const itemTops = body.tops.slice(1);
  const circles = itemTops
    .map(
      (top) =>
        `<circle cx="${PADDING + NUMBER_SIZE / 2}" cy="${top + 21}" r="${NUMBER_SIZE / 2}" fill="${palette.bottom}"/>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${buildHeadingBarSvg({ top: body.tops[0] ?? 0, palette })}
  ${circles}
  <line x1="${PADDING}" y1="${footerTop - 32}" x2="${WIDTH - PADDING}" y2="${footerTop - 32}" stroke="#e5e8eb" stroke-width="2"/>
</svg>`;

  const numberPlacements = numbers.map((number, index) => ({
    input: number.data,
    left: PADDING + Math.round((NUMBER_SIZE - number.info.width) / 2),
    top: (itemTops[index] ?? 0) + 21 - Math.round(number.info.height / 2),
  }));
  return sharp(Buffer.from(svg))
    .composite([
      ...body.placements,
      ...numberPlacements,
      { input: footer.data, left: PADDING, top: footerTop },
    ])
    .png()
    .toBuffer();
}

// 안내는 소개와 구분되도록 옅은 회색 바탕에 그린다. 항목 앞에는 작은 점을 찍는다.
async function renderNoticeImage({
  content,
  palette,
}: {
  content: SeedShowContent;
  palette: Palette;
}): Promise<Buffer> {
  const BULLET_LEFT = PADDING + 8;
  const ITEM_LEFT = PADDING + 32;
  const sections = await Promise.all(
    buildShowNotices(content).map(async ({ heading, items }) => ({
      heading: await renderSectionHeading(heading),
      items: await Promise.all(
        items.map((item) =>
          renderTextImage(item, {
            font: 'medium',
            size: 30,
            width: WIDTH - ITEM_LEFT - PADDING,
            color: SECONDARY_COLOR,
            lineSpacing: 14,
          }),
        ),
      ),
    })),
  );

  const placements: OverlayOptions[] = [];
  const shapes: string[] = [];
  let top = 96;
  sections.forEach(({ heading, items }, sectionIndex) => {
    const body = stackTextImages({
      items: [
        {
          image: heading,
          gap: sectionIndex === 0 ? 0 : 88,
          left: PADDING + 24,
        },
        ...items.map((image, index) => ({
          image,
          gap: index === 0 ? 36 : 20,
          left: ITEM_LEFT,
        })),
      ],
      top,
    });
    placements.push(...body.placements);
    shapes.push(buildHeadingBarSvg({ top: body.tops[0] ?? 0, palette }));
    // 점은 항목 첫 줄의 가운데(위에서 19px)에 맞춘다.
    for (const itemTop of body.tops.slice(1)) {
      shapes.push(
        `<circle cx="${BULLET_LEFT}" cy="${itemTop + 19}" r="4" fill="${SECONDARY_COLOR}"/>`,
      );
    }
    top = body.bottom;
  });
  const height = top + 96;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}">
  <rect width="100%" height="100%" fill="#f2f4f6"/>
  ${shapes.join('')}
</svg>`;
  return sharp(Buffer.from(svg)).composite(placements).png().toBuffer();
}

/** 공연 하나의 상세 이미지를 보여 줄 순서대로 돌려준다. */
export async function renderDetailImages({
  content,
  variant,
}: {
  content: SeedShowContent;
  /** 포스터와 같은 색을 고르는 순번 */
  variant: number;
}): Promise<Buffer[]> {
  const { label, palette } = getShowPalette({ genre: content.genre, variant });
  return Promise.all([
    renderStoryImage({ content, label, palette }),
    renderHighlightsImage({ content, palette }),
    renderNoticeImage({ content, palette }),
  ]);
}
