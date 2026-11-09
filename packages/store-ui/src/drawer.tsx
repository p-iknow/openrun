'use client';

import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import type { ReactNode } from 'react';
import { buttonVariants } from './button.js';
import { cn } from './cn.js';

// 클라이언트용 컴포넌트다. 지시어와 props 규칙은 Button과 같다.
// Server Component에서 쓸 때는 직렬화할 수 있는 props와 요소만 넘기고, onOpenChange는 클라이언트 컴포넌트에서만 넘긴다.
// 아래로 밀기, 바깥 누르기, Esc로 닫기와 포커스 가두기·되돌리기, 뒤 화면 스크롤 잠금은 Base UI Drawer가 맡는다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.

// 열고 닫는 움직임. Base UI 예제의 값을 따른다.
const motion =
  'duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] motion-reduce:duration-0';

interface DrawerContentProps {
  /** 시트 맨 위의 제목. 시트의 접근 가능한 이름이 된다. */
  title: string;
  /** 제목 아래의 짧은 설명. */
  description?: string;
  /** 시트 본문. 길면 본문만 스크롤된다. */
  children: ReactNode;
  /** 시트 아래에 붙는 행동 버튼들. 본문이 스크롤돼도 늘 보이고, 버튼들은 폭을 나눠 갖는다. */
  footer?: ReactNode;
  /**
   * 닫히는 애니메이션이 끝난 뒤 부른다. overlay-kit처럼 시트를 코드로 열고 닫는 도구에서
   * 애니메이션을 끊지 않고 시트를 트리에서 빼낼 때 쓴다. 예: `onCloseComplete={unmount}`.
   */
  onCloseComplete?: () => void;
}

/** 시트를 여는 버튼까지 Drawer가 그린다. 열림 상태는 Drawer가 관리하고, 필요하면 제어할 수도 있다. */
interface DrawerWithTriggerProps extends DrawerContentProps {
  /** 시트를 여는 버튼의 글자. 버튼은 보조 Button 모양이다. */
  triggerLabel: string;
  /** 제어할 때의 열림 상태. `footer`의 버튼으로 시트를 닫으려면 이 값과 `onOpenChange`를 함께 쓴다. */
  open?: boolean;
  /** 열림 상태가 바뀌려 할 때 부른다. 함수라서 Server Component에서는 넘길 수 없다. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * 시트만 그린다. 여는 버튼은 쓰는 쪽이 화면 어디에든 두고, 열림 상태를 직접 제어한다.
 * 닫히면 포커스는 시트를 열기 전에 포커스가 있던 요소(보통 그 버튼)로 돌아간다.
 */
interface DrawerWithoutTriggerProps extends DrawerContentProps {
  triggerLabel?: never;
  /** 열림 상태. 여는 버튼이 없으므로 반드시 제어한다. */
  open: boolean;
  /**
   * 바깥 누르기, Esc, 아래로 밀기, 닫기 버튼으로 닫히려 할 때 `false`로 부른다.
   * 여는 버튼이 없어 `true`로는 부르지 않으므로, overlay-kit의 `close`를 그대로 넘겨도 된다.
   */
  onOpenChange: (open: boolean) => void;
}

export type DrawerProps = DrawerWithTriggerProps | DrawerWithoutTriggerProps;

export function Drawer({
  triggerLabel,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  onCloseComplete,
}: DrawerProps) {
  return (
    <BaseDrawer.Root
      open={open}
      // Base UI가 두 번째 인자로 주는 eventDetails는 공개 API에 드러내지 않는다.
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) onCloseComplete?.();
      }}
    >
      {triggerLabel !== undefined && (
        <BaseDrawer.Trigger
          className={buttonVariants({ variant: 'secondary' })}
        >
          {triggerLabel}
        </BaseDrawer.Trigger>
      )}
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
            {/* 아래로 밀어 닫을 수 있음을 보여 주는 손잡이. 동작은 시트 전체가 받는다. */}
            <div
              aria-hidden="true"
              className="mx-auto mt-sm h-[4px] w-[40px] shrink-0 rounded-full bg-border-strong"
            />
            <div className="flex shrink-0 items-start justify-between gap-md px-xl pt-md">
              <div className="flex flex-col gap-xs">
                <BaseDrawer.Title className="text-title font-bold">
                  {title}
                </BaseDrawer.Title>
                {description && (
                  <BaseDrawer.Description className="text-body-sm text-text-secondary">
                    {description}
                  </BaseDrawer.Description>
                )}
              </div>
              {/* 밀기 동작을 쓸 수 없는 사용자(스크린 리더, 키보드)도 닫을 수 있게 닫기 버튼을 둔다. */}
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
            {/* Content 안에서는 마우스로 글자를 고를 때 시트가 밀리지 않는다. */}
            <BaseDrawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-xl py-lg">
              {children}
            </BaseDrawer.Content>
            {footer && (
              // 홈 표시줄이 있는 휴대폰에서 버튼이 가리지 않도록 아래 안전 영역만큼 띄운다.
              <div className="flex shrink-0 gap-sm border-t border-border px-xl pt-md pb-[calc(var(--spacing-lg)+env(safe-area-inset-bottom,0px))] *:flex-1">
                {footer}
              </div>
            )}
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  );
}
