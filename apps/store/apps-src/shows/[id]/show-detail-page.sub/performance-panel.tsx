import type { ReactNode } from 'react';

// 데스크톱에서 패널이 화면보다 길면 따라오는 동안 아래쪽 회차에 닿을 수 없다.
// 그래서 패널 높이를 화면 높이에서 위아래 여백(xl 두 번)을 뺀 만큼으로 막고, 회차 목록만 안에서 스크롤한다.
export function PerformancePanel({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-lg rounded-panel border border-border p-lg lg:max-h-[calc(100dvh-3rem)]">
      <h2 className="text-title font-bold">회차</h2>
      <div className="min-h-0 lg:overflow-y-auto">{children}</div>
    </section>
  );
}
