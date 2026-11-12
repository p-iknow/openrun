'use client';

import { cn } from '@openrun/store-ui';
import { type ReactNode, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChevronDownIcon } from './filter-bar-button';

// NOL 티켓처럼 상세 이미지는 처음에 일정 높이까지만 보여 주고, 아래 버튼으로 펼치고 접는다.
// 상세 이미지가 길어 회차나 다른 정보까지 한참 스크롤해야 하는 것을 막는다.
// 이미지는 장식(alt="")이고 같은 내용의 소개 본문이 접기 밖에 있어, 접어도 화면 낭독기가 읽는 내용은 줄지 않는다.
export function CollapsibleDetailImages({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }
    // 끝까지 읽고 접으면 내용이 줄어 버튼이 화면 위로 한참 벗어난다. 접은 직후 버튼이 보이도록 화면을 옮긴다.
    flushSync(() => setIsExpanded(false));
    buttonRef.current?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <div className="flex flex-col gap-lg">
      <div
        id={contentId}
        className={cn(
          'relative',
          !isExpanded && 'max-h-[720px] overflow-hidden',
        )}
      >
        {children}
        {/* 접힌 끝을 흐리게 해 아래에 내용이 더 있음을 보여 준다. */}
        {isExpanded ? null : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-linear-to-b from-transparent to-surface"
          />
        )}
      </div>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={toggle}
        className="flex h-[44px] items-center justify-center gap-xs rounded-button border border-border text-body-sm font-semibold outline-primary transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {isExpanded ? '공연 소개 접기' : '공연 소개 더보기'}
        {/* 펼치면 화살표를 뒤집어 위를 가리키게 한다. */}
        <span
          className={cn('transition-transform', isExpanded && 'rotate-180')}
        >
          <ChevronDownIcon />
        </span>
      </button>
    </div>
  );
}
