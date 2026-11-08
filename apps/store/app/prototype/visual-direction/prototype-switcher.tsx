'use client';
// PROTOTYPE: 방향 전환 막대. 화면 디자인의 일부가 아니다.
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

const variants = [
  { key: 'A', name: '부드러운' },
  { key: 'B', name: '단정한 잡지형' },
] as const;

export function PrototypeSwitcher({
  current,
  showId,
}: {
  current: string;
  showId: string | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  const go = useCallback(
    (step: number) => {
      const next = variants[(index + step + variants.length) % variants.length];
      if (!next) return;
      const params = new URLSearchParams({ variant: next.key });
      if (showId) params.set('show', showId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [index, pathname, router, showId],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        target.closest('input, textarea, [contenteditable="true"]') !== null
      )
        return;
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (process.env.NODE_ENV === 'production') return null;

  const currentVariant = variants[index];
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 96,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 999,
        background: '#111',
        color: '#fff',
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 13,
      }}
    >
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="이전 방향"
        style={switcherButton}
      >
        ←
      </button>
      <span>
        {currentVariant?.key} ({currentVariant?.name})
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="다음 방향"
        style={switcherButton}
      >
        →
      </button>
    </div>
  );
}

const switcherButton = {
  border: 0,
  borderRadius: 999,
  width: 28,
  height: 28,
  background: '#333',
  color: '#fff',
  cursor: 'pointer',
} as const;
