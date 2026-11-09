'use client';

import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import type { MouseEventHandler, ReactNode } from 'react';
import { buttonVariants, type ButtonVariant } from './button.js';
import { cn } from './cn.js';

// 클라이언트용 컴포넌트다. 지시어와 props 규칙은 Button과 같다.
// Server Component에서 쓸 때는 직렬화할 수 있는 props와 요소만 넘기고, onOpenChange 같은 함수는 클라이언트 컴포넌트에서만 넘긴다.
// 아래로 밀기, 바깥 누르기, Esc로 닫기와 포커스 가두기·되돌리기, 뒤 화면 스크롤 잠금은 Base UI Drawer가 맡는다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.
//
// 쓰는 쪽에서 조립하는 compound 컴포넌트의 부품들이다. 이 파일은 `Root`, `Trigger`처럼 이름 단위로 내보내고,
// 패키지 진입점(index.ts)이 `export * as Drawer from './drawer.js'`로 묶어 `Drawer.Root`처럼 쓰게 한다(Base UI와 같은 방식).
// 이 파일 안에서 `Drawer` 객체를 만들어 내보내지 않는다. Server Component는 'use client' 파일의 export를 참조로만 받아
// 객체의 속성(`Drawer.Root`)을 꺼낼 수 없어 undefined가 된다. 묶는 일은 서버에서 실행되는 index.ts가 한다.
//
// <Drawer.Root>
//   <Drawer.Trigger>열기</Drawer.Trigger>
//   <Drawer.Popup>
//     <Drawer.Header>
//       <Drawer.Title />
//       <Drawer.Description />
//     </Drawer.Header>
//     <Drawer.Body />
//     <Drawer.Footer>
//       <Drawer.Close />
//     </Drawer.Footer>
//   </Drawer.Popup>
// </Drawer.Root>

// 열고 닫는 움직임. Base UI 예제의 값을 따른다.
const motion =
  'duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] motion-reduce:duration-0';

export interface RootProps {
  /**
   * 제어할 때의 열림 상태. 비우면 `Drawer.Trigger`와 `Drawer.Close`로 Drawer가 스스로 열고 닫는다.
   * `Drawer.Trigger` 없이 쓰려면(버튼을 따로 두거나 overlay-kit으로 열 때) 이 값과 `onOpenChange`를 함께 넘긴다.
   */
  open?: boolean;
  /**
   * 열림 상태가 바뀌려 할 때 부른다. 함수라서 Server Component에서는 넘길 수 없다.
   * `Drawer.Trigger` 없이 쓰면 `false`로만 불리므로, overlay-kit의 `close`를 그대로 넘겨도 된다.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * 닫히는 애니메이션이 끝난 뒤 부른다. overlay-kit처럼 시트를 코드로 열고 닫는 도구에서
   * 애니메이션을 끊지 않고 시트를 트리에서 빼낼 때 쓴다. 예: `onCloseComplete={unmount}`.
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
    <BaseDrawer.Root
      open={open}
      // Base UI가 두 번째 인자로 주는 eventDetails는 공개 API에 드러내지 않는다.
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) onCloseComplete?.();
      }}
    >
      {children}
    </BaseDrawer.Root>
  );
}

export interface TriggerProps {
  /** Button과 같은 종류. 기본은 `secondary`. */
  variant?: ButtonVariant;
  disabled?: boolean;
  children: ReactNode;
}

/** 시트를 여는 버튼. Button 모양이고, 닫히면 포커스가 이 버튼으로 돌아온다. */
export function Trigger({
  variant = 'secondary',
  disabled = false,
  children,
}: TriggerProps) {
  return (
    <BaseDrawer.Trigger
      disabled={disabled}
      className={buttonVariants({ variant })}
    >
      {children}
    </BaseDrawer.Trigger>
  );
}

export interface PopupProps {
  /** `Drawer.Header`, `Drawer.Body`, `Drawer.Footer`를 위에서부터 차례로 넣는다. */
  children: ReactNode;
}

/** 화면 아래에서 올라오는 시트와 뒤 화면을 덮는 막. 맨 위에 아래로 밀 수 있음을 보여 주는 손잡이를 그린다. */
export function Popup({ children }: PopupProps) {
  return (
    <BaseDrawer.Portal>
      {/* 시트를 밀어 내리는 만큼 뒤 화면이 밝아진다. */}
      <BaseDrawer.Backdrop
        className={cn(
          'fixed inset-0 min-h-dvh bg-backdrop opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity data-starting-style:opacity-0 data-ending-style:opacity-0',
          motion,
        )}
      />
      <BaseDrawer.Viewport className="fixed inset-0 flex items-end justify-center">
        <BaseDrawer.Popup
          className={cn(
            'flex max-h-[85dvh] w-full flex-col rounded-t-panel bg-surface text-text shadow-floating outline-none',
            // 미는 동안 손가락을 따라 내려가고, 열릴 때와 닫힐 때는 화면 아래 밖에서 움직인다.
            '[transform:translateY(var(--drawer-swipe-movement-y))] transition-transform data-swiping:select-none data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)]',
            motion,
          )}
        >
          {/* 손잡이는 모양만 보여 준다. 밀기 동작은 시트 전체가 받는다. */}
          <div
            aria-hidden="true"
            className="mx-auto mt-sm h-[4px] w-[40px] shrink-0 rounded-full bg-border-strong"
          />
          {children}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

export interface HeaderProps {
  /** `Drawer.Title`과 `Drawer.Description`을 넣는다. */
  children: ReactNode;
}

/** 시트 맨 위. 왼쪽에 제목과 설명을 쌓고, 오른쪽에 닫기 버튼을 둔다. */
export function Header({ children }: HeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-md px-xl pt-md">
      <div className="flex flex-col gap-xs">{children}</div>
      {/* 밀기 동작을 쓸 수 없는 사용자(스크린 리더, 키보드)도 닫을 수 있게 닫기 버튼을 늘 둔다. */}
      <BaseDrawer.Close
        aria-label="닫기"
        className="-mr-sm flex size-[40px] shrink-0 items-center justify-center rounded-full text-text-secondary outline-primary transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-[20px]"
        >
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </BaseDrawer.Close>
    </div>
  );
}

export interface TitleProps {
  children: ReactNode;
}

/** 시트의 제목. 시트의 접근 가능한 이름이 되므로 꼭 넣는다. */
export function Title({ children }: TitleProps) {
  return (
    <BaseDrawer.Title className="text-title font-bold">
      {children}
    </BaseDrawer.Title>
  );
}

export interface DescriptionProps {
  children: ReactNode;
}

/** 제목 아래의 짧은 설명. 스크린 리더가 시트를 열 때 함께 읽는다. */
export function Description({ children }: DescriptionProps) {
  return (
    <BaseDrawer.Description className="text-body-sm text-text-secondary">
      {children}
    </BaseDrawer.Description>
  );
}

export interface BodyProps {
  children: ReactNode;
}

/** 시트 본문. 길면 본문만 스크롤된다. */
export function Body({ children }: BodyProps) {
  return (
    // Content 안에서는 마우스로 글자를 고를 때 시트가 밀리지 않는다.
    // 본문이 맨 아래이면(footer가 없으면) 홈 표시줄에 가리지 않도록 아래 안전 영역만큼 더 띄운다.
    <BaseDrawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-xl py-lg last:pb-[calc(var(--spacing-lg)+env(safe-area-inset-bottom,0px))]">
      {children}
    </BaseDrawer.Content>
  );
}

export interface FooterProps {
  /** 행동 버튼들. 버튼들은 폭을 나눠 갖는다. */
  children: ReactNode;
}

/** 시트 아래에 붙는 행동 버튼 줄. 본문이 스크롤돼도 늘 보인다. */
export function Footer({ children }: FooterProps) {
  return (
    // 홈 표시줄이 있는 휴대폰에서 버튼이 가리지 않도록 아래 안전 영역만큼 띄운다.
    <div className="flex shrink-0 gap-sm border-t border-border px-xl pt-md pb-[calc(var(--spacing-lg)+env(safe-area-inset-bottom,0px))] *:flex-1">
      {children}
    </div>
  );
}

export interface CloseProps {
  /** Button과 같은 종류. 기본은 `secondary`. */
  variant?: ButtonVariant;
  /** 시트를 닫기 전에 부른다. 예: 고른 값을 적용한다. 함수라서 Server Component에서는 넘길 수 없다. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

/** 누르면 시트를 닫는 Button 모양 버튼. 열림 상태를 제어하지 않아도 footer의 "적용" 같은 버튼으로 시트를 닫을 수 있다. */
export function Close({
  variant = 'secondary',
  onClick,
  children,
}: CloseProps) {
  return (
    <BaseDrawer.Close onClick={onClick} className={buttonVariants({ variant })}>
      {children}
    </BaseDrawer.Close>
  );
}
