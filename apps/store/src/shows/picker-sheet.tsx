'use client';

import { Dialog, Drawer } from '@openrun/store-ui';
import type { ReactNode } from 'react';

// 필터와 정렬을 고르는 창. 좁은 화면에서는 아래에서 올라오는 바텀 시트(Drawer), 넓은 화면에서는 가운데 대화상자(Dialog)로 연다.
// 두 컴포넌트는 머리, 본문, 아래 행동 줄의 모양이 같아 같은 내용을 그대로 넣는다.
// 창은 overlay-kit(`overlay.openAsync`)으로 연다. 어느 쪽으로 열지는 여는 버튼을 누를 때 `isWideScreen`으로 정해 `wide`로 넘긴다.
// 창은 버튼을 누른 뒤에야 그려지므로 화면 폭을 서버 렌더링 중에 읽지 않아, 서버가 그린 HTML과 첫 렌더링이 달라지지 않는다(hydration 불일치가 없다).
// overlay-kit이 준 `isOpen`은 `open`에, 닫기는 `onOpenChange`에, `unmount`는 닫히는 애니메이션이 끝난 뒤의 `onCloseComplete`에 넘긴다.
// 행동 버튼은 Drawer.Close 대신 일반 Button을 쓰고, 누르면 overlay-kit의 `close`로 닫는다. 두 컴포넌트에서 같은 버튼을 쓰기 위해서다.

/** 넓은 화면의 기준. 공연 카드 배치와 같은 Tailwind `sm`(40rem)이다. */
const WIDE_SCREEN_QUERY = '(min-width: 40rem)';

/** 지금 화면이 넓은 화면(대화상자로 여는 폭)인지 본다. 이벤트 처리 중에만 부른다. */
export function isWideScreen(): boolean {
  return window.matchMedia(WIDE_SCREEN_QUERY).matches;
}

export function PickerSheet({
  wide,
  open,
  onOpenChange,
  onCloseComplete,
  title,
  footer,
  children,
}: {
  /** 대화상자로 열지. 여는 버튼에서 `isWideScreen()`으로 정한다. */
  wide: boolean;
  /** overlay-kit의 `isOpen` */
  open: boolean;
  /** 바깥 누르기, Esc, 닫기 버튼으로 닫으려 할 때 부른다. */
  onOpenChange: (open: boolean) => void;
  /** 닫히는 애니메이션이 끝난 뒤 부른다. overlay-kit의 `unmount`를 넘긴다. */
  onCloseComplete: () => void;
  title: string;
  /** 아래 행동 줄의 버튼들. 없으면 줄을 그리지 않는다. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  if (wide) {
    return (
      <Dialog.Root
        open={open}
        onOpenChange={onOpenChange}
        onCloseComplete={onCloseComplete}
      >
        <Dialog.Popup>
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>{children}</Dialog.Body>
          {footer !== undefined && <Dialog.Footer>{footer}</Dialog.Footer>}
        </Dialog.Popup>
      </Dialog.Root>
    );
  }
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      onCloseComplete={onCloseComplete}
    >
      <Drawer.Popup>
        <Drawer.Header>
          <Drawer.Title>{title}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>{children}</Drawer.Body>
        {footer !== undefined && <Drawer.Footer>{footer}</Drawer.Footer>}
      </Drawer.Popup>
    </Drawer.Root>
  );
}
