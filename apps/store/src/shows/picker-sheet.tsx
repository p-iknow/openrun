'use client';

import { Dialog, Drawer } from '@openrun/store-ui';
import { overlay } from 'overlay-kit';
import type { ReactNode } from 'react';

// 필터와 정렬을 고르는 창. 좁은 화면에서는 아래에서 올라오는 바텀 시트(Drawer), 넓은 화면에서는 가운데 대화상자(Dialog)로 연다.
// 두 컴포넌트는 머리, 본문, 아래 행동 줄의 모양이 같아 같은 내용을 그대로 넣는다.
//
// 창은 `openPickerSheet`로 연다. 이 함수가 창 종류를 정하고 overlay-kit의 `overlay.openAsync`로 창을 띄운 뒤,
// 창이 `close`로 넘긴 결과(닫기만 했으면 `null`)를 돌려준다. 여는 쪽은 결과가 있을 때 적용하기만 한다.
// 어느 쪽으로 열지는 여는 순간 `isWideScreen`으로 한 번만 정한다. 창은 버튼을 누른 뒤에야 그려지므로 화면 폭을 서버 렌더링 중에 읽지 않아,
// 서버가 그린 HTML과 첫 렌더링이 달라지지 않는다(hydration 불일치가 없다). 창이 열린 뒤 화면 폭이 바뀌어도 그대로 둔다.
// 행동 버튼은 Drawer.Close 대신 일반 Button을 쓰고, 누르면 `controller.close`로 닫는다. 두 컴포넌트에서 같은 버튼을 쓰기 위해서다.

/** 넓은 화면의 기준. 공연 카드 배치와 같은 Tailwind `sm`(40rem)이다. */
const WIDE_SCREEN_QUERY = '(min-width: 40rem)';

/** 지금 화면이 넓은 화면(대화상자로 여는 폭)인지 본다. 이벤트 처리 중에만 부른다. */
function isWideScreen(): boolean {
  return window.matchMedia(WIDE_SCREEN_QUERY).matches;
}

/** 창 하나를 열고 닫는 데 필요한 값. `openPickerSheet`가 만들어 창 내용에 넘기고, 창 내용은 `PickerSheet`에 그대로 넘긴다. */
export interface PickerController<T> {
  /** 대화상자로 열지 */
  wide: boolean;
  /** overlay-kit의 `isOpen` */
  isOpen: boolean;
  /** 창을 닫고 결과를 돌려준다. 고르지 않고 닫으면 `null`이다. */
  close: (result: T | null) => void;
  /** overlay-kit의 `unmount`. 닫히는 애니메이션이 끝난 뒤 창을 트리에서 뺀다. */
  unmount: () => void;
}

/** 창을 열고, 창이 돌려준 결과를 기다린다. 고르지 않고 닫으면 `null`이다. 클릭 같은 이벤트 처리 중에 부른다. */
export function openPickerSheet<T>(
  render: (controller: PickerController<T>) => ReactNode,
): Promise<T | null> {
  const wide = isWideScreen();
  return overlay.openAsync<T | null>(({ isOpen, close, unmount }) =>
    render({ wide, isOpen, close, unmount }),
  );
}

export function PickerSheet<T>({
  controller,
  title,
  footer,
  children,
}: {
  controller: PickerController<T>;
  title: string;
  /** 아래 행동 줄의 버튼들. 없으면 줄을 그리지 않는다. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { wide, isOpen, close, unmount } = controller;
  // 바깥 누르기, Esc, 닫기 버튼으로 닫으면 결과 없이 닫는다.
  const dismiss = () => {
    close(null);
  };
  if (wide) {
    return (
      <Dialog.Root
        open={isOpen}
        onOpenChange={dismiss}
        onCloseComplete={unmount}
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
    <Drawer.Root open={isOpen} onOpenChange={dismiss} onCloseComplete={unmount}>
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
