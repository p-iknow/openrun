import { Button, Drawer, Skeleton } from '@openrun/store-ui';
import type { ReactNode } from 'react';

// 모바일의 고정 버튼과 회차 시트. NOL 티켓처럼 "예매하기"를 누르면 달력과 회차가 담긴 시트가 아래에서 올라온다.
// 예매(좌석 선택)는 1.5에서 넣는다. 그때 시트 아래 "예매하기" 버튼이 고른 회차로 예매를 시작한다.
// 판매가 끝난 공연은 고를 회차가 없어 버튼을 막아 둔다.
export function PerformanceSheet({
  showTitle,
  isSalesEnded,
  children,
}: {
  showTitle: string;
  isSalesEnded: boolean;
  children: ReactNode;
}) {
  if (isSalesEnded) {
    return <Button disabled>판매 종료</Button>;
  }
  return (
    <Drawer.Root>
      <Drawer.Trigger variant="primary">예매하기</Drawer.Trigger>
      <Drawer.Popup>
        <Drawer.Header>
          <Drawer.Title>관람일 선택</Drawer.Title>
          <Drawer.Description>{showTitle}</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body>{children}</Drawer.Body>
        {/* NOL 티켓처럼 시트를 연 뒤에도 같은 자리에 "예매하기" 버튼이 남는다. 본문이 스크롤돼도 늘 보인다.
            예매는 회차를 고른 뒤 시작하는데 회차 선택은 1.5에서 넣으므로, 그때까지는 버튼을 막아 둔다. */}
        <Drawer.Footer>
          <Button disabled>예매하기</Button>
        </Drawer.Footer>
      </Drawer.Popup>
    </Drawer.Root>
  );
}

export function PerformanceSheetSkeleton() {
  return <Skeleton className="h-[52px] w-full rounded-button" />;
}
