// tokens.css를 읽어 토큰 화면에 보여 줄 값을 뽑는다.
// 토큰 값을 여기 다시 적지 않아, 스토어와 Storybook이 같은 파일만 바라본다.

export interface PaletteColor {
  /** 예: `blue-500` */
  name: string;
  hex: string;
}

export interface SemanticColor {
  /** 예: `primary` → `bg-primary`, `text-primary` */
  name: string;
  /** 연결된 팔레트 이름. 팔레트를 거치지 않는 값(흰색 등)은 `null`. */
  palette: string | null;
  hex: string;
}

export interface ThemeValue {
  name: string;
  value: string;
}

export interface Tokens {
  palette: PaletteColor[];
  colors: SemanticColor[];
  textSizes: ThemeValue[];
  spacing: ThemeValue[];
  radii: ThemeValue[];
}

const declaration = /--([\w-]+):\s*([^;]+);/g;

function declarations(block: string): [string, string][] {
  return [...block.matchAll(declaration)].map((m) => [m[1]!, m[2]!.trim()]);
}

function blockAfter(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`tokens.css에 ${selector} 블록이 없다.`);
  const end = css.indexOf('}', start);
  return css.slice(start, end);
}

function withPrefix(theme: [string, string][], prefix: string): ThemeValue[] {
  return theme
    .filter(([name, value]) => name.startsWith(prefix) && value !== 'initial')
    .map(([name, value]) => ({ name: name.slice(prefix.length), value }))
    .filter(({ name }) => !name.includes('--'));
}

export function readTokens(css: string): Tokens {
  const palette = declarations(blockAfter(css, ':root')).map(([name, hex]) => ({
    name,
    hex,
  }));
  const hexOf = new Map(palette.map((p) => [p.name, p.hex]));
  const theme = declarations(blockAfter(css, '@theme'));

  const colors = withPrefix(theme, 'color-').map(({ name, value }) => {
    const ref = /^var\(--([\w-]+)\)$/.exec(value)?.[1] ?? null;
    return {
      name,
      palette: ref,
      hex: ref ? (hexOf.get(ref) ?? value) : value,
    };
  });

  return {
    palette,
    colors,
    textSizes: withPrefix(theme, 'text-'),
    spacing: withPrefix(theme, 'spacing-'),
    radii: withPrefix(theme, 'radius-'),
  };
}
