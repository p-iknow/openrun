import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import tokensCss from '../tokens.css?raw';
import { readTokens, type PaletteColor } from './read-tokens.js';

const tokens = readTokens(tokensCss);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-lg">
      <h2 className="text-heading font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ hex }: { hex: string }) {
  return (
    <span
      className="block size-[32px] shrink-0 rounded-badge border border-border"
      style={{ backgroundColor: hex }}
    />
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <table className="w-full border-collapse text-left text-body-sm">
      <thead className="text-text-secondary">
        <tr className="border-b border-border-strong">
          {head.map((h) => (
            <th key={h} scope="col" className="py-sm pr-lg font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

const cell = 'py-sm pr-lg align-middle';
const code = 'font-mono text-caption';

function groupPalette(palette: PaletteColor[]): [string, PaletteColor[]][] {
  const groups = new Map<string, PaletteColor[]>();
  for (const color of palette) {
    const family = color.name.replace(/-\d+$/, '');
    groups.set(family, [...(groups.get(family) ?? []), color]);
  }
  return [...groups];
}

function TokensPage() {
  return (
    <div className="flex max-w-content flex-col gap-3xl p-xl">
      <Section title="의미 토큰 색">
        <p className="text-body-sm text-text-secondary">
          화면 코드는 의미 토큰만 쓴다. 예: <code className={code}>bg-primary</code>,{' '}
          <code className={code}>text-text-secondary</code>,{' '}
          <code className={code}>border-border</code>.
        </p>
        <Table head={['색', '의미 토큰', '팔레트', '값']}>
          {tokens.colors.map((c) => (
            <tr key={c.name} className="border-b border-border">
              <td className={cell}>
                <Swatch hex={c.hex} />
              </td>
              <td className={`${cell} ${code}`}>{c.name}</td>
              <td className={`${cell} ${code}`}>{c.palette ?? '-'}</td>
              <td className={`${cell} ${code}`}>{c.hex}</td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="기본 팔레트">
        <p className="text-body-sm text-text-secondary">
          TDS 라이트 팔레트. CSS 변수(<code className={code}>var(--blue-500)</code>
          )로만 있고 유틸리티 클래스는 만들지 않는다.
        </p>
        <div className="flex flex-col gap-lg">
          {groupPalette(tokens.palette).map(([family, colors]) => (
            <div key={family} className="flex flex-col gap-sm">
              <h3 className="text-body font-semibold">{family}</h3>
              <ul className="grid grid-cols-5 gap-sm md:grid-cols-10">
                {colors.map((c) => (
                  <li key={c.name} className="flex flex-col gap-xs">
                    <span
                      className="block h-[40px] rounded-badge border border-border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className={code}>{c.name.replace(`${family}-`, '')}</span>
                    <span className={`${code} text-text-secondary`}>{c.hex}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="글자 크기">
        <Table head={['토큰', '크기', '예시']}>
          {tokens.textSizes.map((t) => (
            <tr key={t.name} className="border-b border-border">
              <td className={`${cell} ${code}`}>text-{t.name}</td>
              <td className={`${cell} ${code}`}>{t.value}</td>
              <td className={cell} style={{ fontSize: `var(--text-${t.name})` }}>
                공연 예매 2026.12.24 55,000원
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="간격">
        <p className="text-body-sm text-text-secondary">
          <code className={code}>p-lg</code>, <code className={code}>gap-sm</code>,{' '}
          <code className={code}>mt-xl</code>처럼 쓴다.
        </p>
        <Table head={['토큰', '크기', '예시']}>
          {tokens.spacing.map((s) => (
            <tr key={s.name} className="border-b border-border">
              <td className={`${cell} ${code}`}>*-{s.name}</td>
              <td className={`${cell} ${code}`}>{s.value}</td>
              <td className={cell}>
                <span
                  className="block h-[16px] bg-primary"
                  style={{ width: `var(--spacing-${s.name})` }}
                />
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="모서리">
        <ul className="flex flex-wrap gap-xl">
          {tokens.radii.map((r) => (
            <li key={r.name} className="flex flex-col items-center gap-sm">
              <span
                className="block size-[80px] border border-border-strong bg-surface-muted"
                style={{ borderRadius: `var(--radius-${r.name})` }}
              />
              <span className={code}>rounded-{r.name}</span>
              <span className={`${code} text-text-secondary`}>{r.value}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

const meta = {
  title: 'Foundations/Tokens',
  component: TokensPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '`src/tokens.css`를 읽어 그린다. 토큰을 고치면 이 화면도 바뀐다.',
      },
    },
  },
} satisfies Meta<typeof TokensPage>;

export default meta;

export const Tokens: StoryObj<typeof meta> = {};
