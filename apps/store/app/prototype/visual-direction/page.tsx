// PROTOTYPE: 1.2 스토어 시각적 방향 비교. 방향 A, B를 같은 경로에서 `?variant=`로 바꾼다.
// `?show=<id>`를 붙이면 공연 상세가 열린다. 방향을 고른 뒤 이 폴더째 지운다.
import './tokens.css';
import { PrototypeSwitcher } from './prototype-switcher';
import { VariantA } from './variant-a';
import { VariantB } from './variant-b';

type SearchParams = Promise<{ variant?: string; show?: string }>;

export default async function VisualDirectionPrototype({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { variant = 'A', show } = await searchParams;
  return (
    <div className="prototype-root">
      {variant === 'B' ? (
        <VariantB showId={show} />
      ) : (
        <VariantA showId={show} />
      )}
      <PrototypeSwitcher current={variant} showId={show} />
    </div>
  );
}
