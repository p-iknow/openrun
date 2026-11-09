import { useRender } from '@base-ui/react/use-render';
import type { ReactElement, ReactNode } from 'react';
import { cn } from './cn.js';

// 서버용 컴포넌트다. 상태와 브라우저 API를 쓰지 않는다.
// 모양과 접근성 속성만 맡고, 어떤 요소로 어디로 갈지(<a>, Next.js의 Link, 주소 규칙)는 쓰는 쪽이 render로 넘긴다.
// useRender는 Base UI의 render 방식을 그대로 쓰기 위한 것이다. 서버에서는 ref를 합치는 훅을 건너뛰므로 Server Component에서 그려진다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.

const MAX_PAGE_LINKS = 5;

const itemClass =
  'inline-flex size-[40px] items-center justify-center rounded-full text-body-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const linkClass = 'text-text-secondary hover:bg-surface-muted';
const activeClass = 'bg-primary text-on-primary hover:bg-primary-hover';
const disabledClass = 'cursor-not-allowed text-text-tertiary';

export interface PaginationPage {
  page: number;
  /** 현재 페이지인지. `Pagination.Link`의 `active`에 그대로 넘긴다. */
  isActive: boolean;
}

export interface PaginationModel {
  /** 보여 줄 번호. 현재 페이지 주변 최대 5개. */
  pages: PaginationPage[];
  /** 이전 페이지 번호. 첫 페이지에서는 갈 곳이 없으므로 `hasPreviousPage`가 `false`다. */
  previousPage: number;
  /** 다음 페이지 번호. 마지막 페이지에서는 갈 곳이 없으므로 `hasNextPage`가 `false`다. */
  nextPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * 번호 줄에 무엇을 보여 줄지 계산한다. 현재 페이지를 가운데에 두되, 끝에 닿으면 반대쪽으로 밀어 최대 5개를 채운다.
 * 주소는 만들지 않는다. 결과로 쓰는 쪽이 링크를 만들어 각 컴포넌트의 `render`에 넘긴다.
 */
export function getPagination({
  currentPage,
  totalPages,
}: {
  /** 1부터 센다. */
  currentPage: number;
  totalPages: number;
}): PaginationModel {
  const count = Math.max(0, Math.min(MAX_PAGE_LINKS, totalPages));
  const first = Math.max(
    1,
    Math.min(
      currentPage - Math.floor(MAX_PAGE_LINKS / 2),
      totalPages - count + 1,
    ),
  );
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  return {
    pages: Array.from({ length: count }, (_, i) => {
      const page = first + i;
      return { page, isActive: page === currentPage };
    }),
    // 갈 곳이 없어도 숫자로 둬서 쓰는 쪽이 분기 없이 링크를 만들게 한다. 그 링크는 disabled일 때 그려지지 않는다.
    previousPage: hasPreviousPage ? currentPage - 1 : currentPage,
    nextPage: hasNextPage ? currentPage + 1 : currentPage,
    hasPreviousPage,
    hasNextPage,
  };
}

export interface PaginationRootProps {
  /** `Pagination.Previous`, `Pagination.Link`, `Pagination.Next`. */
  children: ReactNode;
}

function PaginationRoot({ children }: PaginationRootProps) {
  return (
    <nav aria-label="페이지">
      <ul className="flex items-center justify-center gap-xs">{children}</ul>
    </nav>
  );
}

export interface PaginationLinkProps {
  /** 이동할 링크 요소. 예: `<a href="/shows?page=2" />`, `<Link href="/shows?page=2" />`. 요소의 속성은 그대로 남고, 모양과 `aria-current`가 더해진다. */
  render: ReactElement;
  /** 현재 페이지이면 `primary`로 채우고 `aria-current="page"`를 붙인다. 보통 `getPagination`이 돌려준 `isActive`를 넘긴다. */
  active?: boolean;
  children: ReactNode;
}

function PaginationLink({
  render,
  active = false,
  children,
}: PaginationLinkProps) {
  const element = useRender({
    render,
    defaultTagName: 'a',
    props: {
      'aria-current': active ? 'page' : undefined,
      className: cn(itemClass, active ? activeClass : linkClass),
      children,
    },
  });
  return <li>{element}</li>;
}

// 이전과 다음은 이 표 하나로만 다르다.
const steps = {
  previous: { label: '이전 페이지', iconPath: 'M12 5l-5 5 5 5' },
  next: { label: '다음 페이지', iconPath: 'M8 5l5 5-5 5' },
} as const;

export interface PaginationStepProps {
  /** 이동할 링크 요소. 예: `<Link href="/shows?page=3" />`. */
  render: ReactElement;
  /**
   * 갈 곳이 없을 때(첫 페이지의 이전, 마지막 페이지의 다음) `true`. `render`는 그리지 않고 비활성 링크를 그린다.
   * 빠뜨리면 없는 페이지로 가는 링크가 살아 있게 되므로 필수다. 보통 `getPagination`의 `hasPreviousPage`/`hasNextPage`를 뒤집어 넘긴다.
   */
  disabled: boolean;
}

function PaginationStep({
  direction,
  render,
  disabled,
}: PaginationStepProps & { direction: keyof typeof steps }) {
  const { label, iconPath } = steps[direction];
  const element = useRender({
    // 비활성이면 쓰는 쪽 요소 대신 href 없는 <a>를 그린다. Next.js의 Link처럼 href가 꼭 필요한 요소에서 href를 뺄 수 없기 때문이다.
    // href가 없으니 이동과 포커스가 막히고, role과 aria-disabled로 비활성 링크임을 알린다.
    render: disabled ? <a role="link" aria-disabled="true" /> : render,
    defaultTagName: 'a',
    props: {
      'aria-label': label,
      className: cn(itemClass, disabled ? disabledClass : linkClass),
      children: (
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[20px]"
        >
          <path d={iconPath} />
        </svg>
      ),
    },
  });
  return <li>{element}</li>;
}

function PaginationPrevious(props: PaginationStepProps) {
  return <PaginationStep direction="previous" {...props} />;
}

function PaginationNext(props: PaginationStepProps) {
  return <PaginationStep direction="next" {...props} />;
}

/**
 * Base UI처럼 부품을 조립해 쓴다.
 * 모두 서버용이라 Server Component에서 `Pagination.Link`처럼 점으로 꺼내 써도 된다(클라이언트 컴포넌트였다면 점 접근이 서버·클라이언트 경계에서 깨진다).
 */
export const Pagination = {
  Root: PaginationRoot,
  Link: PaginationLink,
  Previous: PaginationPrevious,
  Next: PaginationNext,
};
