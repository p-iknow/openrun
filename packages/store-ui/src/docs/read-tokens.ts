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

function parseDeclarations(block: string): [string, string][] {
  return [...block.matchAll(declaration)].map((m) => [m[1]!, m[2]!.trim()]);
}

/**
 * `selector` 블록의 최상위 내용만 돌려준다. 중괄호 깊이를 세어 짝이 맞는 `}`까지 읽고,
 * `@keyframes` 같은 중첩 블록 안의 내용은 뺀다. 주석이나 문자열 안의 중괄호는 없다고 가정한다.
 */
function getTopLevelBlock({
  css,
  selector,
}: {
  css: string;
  selector: string;
}): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`tokens.css에 ${selector} 블록이 없다.`);
  let depth = 0;
  let topLevel = '';
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    const char = css[i];
    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) return topLevel;
    } else if (depth === 1) topLevel += char;
  }
  throw new Error(`tokens.css의 ${selector} 블록이 닫히지 않았다.`);
}

/** `prefix`로 시작하는 토큰을 접두어를 뗀 이름으로 뽑는다. 지우기용 `initial`과 `--line-height` 같은 부가 값은 뺀다. */
function filterThemeValues({
  theme,
  prefix,
}: {
  theme: [string, string][];
  prefix: string;
}): ThemeValue[] {
  return theme
    .filter(([name, value]) => name.startsWith(prefix) && value !== 'initial')
    .map(([name, value]) => ({ name: name.slice(prefix.length), value }))
    .filter(({ name }) => !name.includes('--'));
}

export function readTokens(css: string): Tokens {
  const palette = parseDeclarations(
    getTopLevelBlock({ css, selector: ':root' }),
  ).map(([name, hex]) => ({
    name,
    hex,
  }));
  const hexByName = new Map(palette.map((p) => [p.name, p.hex]));
  const theme = parseDeclarations(
    getTopLevelBlock({ css, selector: '@theme' }),
  );

  const colors = filterThemeValues({ theme, prefix: 'color-' }).map(
    ({ name, value }) => {
      const ref = /^var\(--([\w-]+)\)$/.exec(value)?.[1] ?? null;
      return {
        name,
        palette: ref,
        hex: ref ? (hexByName.get(ref) ?? value) : value,
      };
    },
  );

  return {
    palette,
    colors,
    textSizes: filterThemeValues({ theme, prefix: 'text-' }),
    spacing: filterThemeValues({ theme, prefix: 'spacing-' }),
    radii: filterThemeValues({ theme, prefix: 'radius-' }),
  };
}
