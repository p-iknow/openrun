import type { ReactNode } from 'react';

// 데스크톱(lg)은 2단이다. 왼쪽이 공연 정보, 오른쪽이 스크롤을 따라오는 회차 패널이다.
// 모바일은 한 단이라 회차 패널을 본문에 두면 공연 정보 맨 아래로 밀려 보이지 않는다. 그래서 NOL 티켓처럼
// 화면 아래에 고정 버튼 줄(bottomBar)을 두고, 버튼이 회차 시트를 연다. 화면 폭은 CSS로만 나눈다.
// 상세 화면과 로딩 화면이 같은 틀을 써서, 응답이 와도 자리가 흔들리지 않는다.
export function ShowDetailLayout({
  info,
  panel,
  bottomBar,
}: {
  info: ReactNode;
  panel: ReactNode;
  bottomBar: ReactNode;
}) {
  return (
    // 모바일에서는 고정 버튼 줄(버튼 높이 52px와 위아래 여백)만큼 아래를 비워 마지막 내용이 가리지 않게 한다.
    <main className="grid grid-cols-1 gap-2xl pb-[calc(52px+var(--spacing-md)+var(--spacing-lg)+env(safe-area-inset-bottom,0px))] lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:pb-0">
      {info}
      {/* 머리글은 스크롤과 함께 올라가므로 화면 맨 위에서 본문 간격(xl)만큼 띄워 붙는다. */}
      <aside className="hidden lg:sticky lg:top-xl lg:block">{panel}</aside>
      {/* 홈 표시줄이 있는 휴대폰에서 버튼이 가리지 않도록 아래 안전 영역만큼 띄운다. 버튼은 줄 폭을 채운다.
          여백을 시트 아래 버튼 줄(Drawer.Footer)과 같게 두어, 시트가 열려도 "예매하기" 버튼이 같은 자리에 있다. */}
      <div className="fixed inset-x-0 bottom-0 grid border-t border-border bg-surface px-lg pt-md pb-[calc(var(--spacing-lg)+env(safe-area-inset-bottom,0px))] lg:hidden">
        {bottomBar}
      </div>
    </main>
  );
}
