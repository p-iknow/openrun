'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
import { CloseIcon } from './close-icon.js';
import { cn } from './cn.js';

// 클라이언트용 컴포넌트다. 지시어와 props 규칙은 Button과 같다.
// Server Component에서 쓸 때는 직렬화할 수 있는 props와 요소만 넘기고, onOpenChange 같은 함수는 클라이언트 컴포넌트에서만 넘긴다.
// 화면 가운데에 뜨는 대화상자다. 바깥 누르기, Esc로 닫기와 포커스 가두기·되돌리기, 뒤 화면 스크롤 잠금은 Base UI Dialog가 맡는다.
// 머리, 본문, 아래 행동 줄의 모양은 Drawer와 같게 두어, 좁은 화면의 바텀 시트와 넓은 화면의 대화상자가 같은 내용을 같은 배치로 보인다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.
//
// 부품을 이름 단위로 내보내고 패키지 진입점이 `export * as Dialog`로 묶는다. 까닭은 drawer.tsx 머리 주석과 같다.
//
// <Dialog.Root open onOpenChange>
//   <Dialog.Popup>
//     <Dialog.Header>
//       <Dialog.Title />
//       <Dialog.Description />
//     </Dialog.Header>
//     <Dialog.Body />
//     <Dialog.Footer />
//   </Dialog.Popup>
// </Dialog.Root>

// 나타나고 사라지는 움직임. 짧게 흐려지며 조금 떠오른다.
const motion = 'duration-200 ease-out motion-reduce:duration-0';

export interface RootProps {
  /** 열림 상태. 여는 버튼을 쓰는 쪽에서 두므로 늘 제어한다. overlay-kit으로 열면 `isOpen`을 넘긴다. */
  open: boolean;
  /** 열림 상태가 바뀌려 할 때 부른다(바깥 누르기, Esc, 닫기 버튼이면 `false`). 함수라서 Server Component에서는 넘길 수 없다. */
  onOpenChange: (open: boolean) => void;
  /**
   * 닫히는 애니메이션이 끝난 뒤 부른다. overlay-kit처럼 대화상자를 코드로 열고 닫는 도구에서
   * 애니메이션을 끊지 않고 대화상자를 트리에서 빼낼 때 쓴다. 예: `onCloseComplete={unmount}`.
   */
  onCloseComplete?: () => void;
  children: ReactNode;
}

/** 부품들이 열림 상태를 나눠 갖게 한다. 요소를 그리지 않는다. */
export function Root({
  open,
  onOpenChange,
  onCloseComplete,
  children,
}: RootProps) {
  return (
    <BaseDialog.Root
      open={open}
      // Base UI가 두 번째 인자로 주는 eventDetails는 공개 API에 드러내지 않는다.
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) onCloseComplete?.();
      }}
    >
      {children}
    </BaseDialog.Root>
  );
}

export interface PopupProps {
  /** `Dialog.Header`, `Dialog.Body`, `Dialog.Footer`를 위에서부터 차례로 넣는다. */
  children: ReactNode;
}

/** 화면 가운데의 대화상자와 뒤 화면을 덮는 막. 폭은 480px까지다. */
export function Popup({ children }: PopupProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        className={cn(
          'fixed inset-0 min-h-dvh bg-backdrop transition-opacity data-starting-style:opacity-0 data-ending-style:opacity-0',
          motion,
        )}
      />
      <BaseDialog.Viewport className="fixed inset-0 flex items-center justify-center p-xl">
        <BaseDialog.Popup
          className={cn(
            'flex max-h-[85dvh] w-full max-w-[480px] flex-col rounded-panel bg-surface text-text shadow-floating outline-none',
            'transition-[transform,opacity] data-starting-style:translate-y-[16px] data-starting-style:opacity-0 data-ending-style:translate-y-[16px] data-ending-style:opacity-0',
            motion,
          )}
        >
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

export interface HeaderProps {
  /** `Dialog.Title`과 `Dialog.Description`을 넣는다. */
  children: ReactNode;
}

/** 대화상자 맨 위. 왼쪽에 제목과 설명을 쌓고, 오른쪽에 닫기 버튼을 둔다. */
export function Header({ children }: HeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-md px-xl pt-lg">
      <div className="flex flex-col gap-xs">{children}</div>
      <BaseDialog.Close
        aria-label="닫기"
        className="-mr-sm flex size-[40px] shrink-0 items-center justify-center rounded-full text-text-secondary outline-primary transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <CloseIcon />
      </BaseDialog.Close>
    </div>
  );
}

export interface TitleProps {
  children: ReactNode;
}

/** 대화상자의 제목. 대화상자의 접근 가능한 이름이 되므로 꼭 넣는다. */
export function Title({ children }: TitleProps) {
  return (
    <BaseDialog.Title className="text-title font-bold">
      {children}
    </BaseDialog.Title>
  );
}

export interface DescriptionProps {
  children: ReactNode;
}

/** 제목 아래의 짧은 설명. 스크린 리더가 대화상자를 열 때 함께 읽는다. */
export function Description({ children }: DescriptionProps) {
  return (
    <BaseDialog.Description className="text-body-sm text-text-secondary">
      {children}
    </BaseDialog.Description>
  );
}

export interface BodyProps {
  children: ReactNode;
}

/** 대화상자 본문. 길면 본문만 스크롤된다. */
export function Body({ children }: BodyProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-xl py-lg">
      {children}
    </div>
  );
}

export interface FooterProps {
  /** 행동 버튼들. 버튼들은 폭을 나눠 갖는다. 누르고 닫으려면 버튼에서 `onOpenChange(false)`처럼 열림 상태를 바꾼다. */
  children: ReactNode;
}

/** 대화상자 아래에 붙는 행동 버튼 줄. 본문이 스크롤돼도 늘 보인다. */
export function Footer({ children }: FooterProps) {
  return (
    <div className="flex shrink-0 gap-sm border-t border-border px-xl py-md *:flex-1">
      {children}
    </div>
  );
}
