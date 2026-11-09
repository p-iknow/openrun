import { cn } from './cn.js';

// 서버용 컴포넌트다. 훅, 상태, 브라우저 API를 쓰지 않는다.
// 이동은 일반 <a href>로 하므로 자바스크립트 없이도 동작하고, next에 의존하지 않는다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.

const MAX_PAGE_LINKS = 5;

const itemClass =
  'inline-flex size-[40px] items-center justify-center rounded-full text-body-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const linkClass = 'text-text-secondary hover:bg-surface-muted';
const currentClass = 'bg-primary text-on-primary hover:bg-primary-hover';
const disabledClass = 'cursor-not-allowed text-text-tertiary';

export interface PaginationProps {
  /** 1부터 센다. */
  currentPage: number;
  totalPages: number;
  /** 링크의 바탕 주소. 이미 있는 쿼리(필터 등)는 유지하고 페이지 쿼리만 바꾼다. 예: `/shows?genre=musical`. */
  baseUrl: string;
  /** 페이지 번호를 담을 쿼리 이름. 기본은 `page`. */
  queryName?: string;
}

// 기본 주소의 경로와 해시는 그대로 두고 쿼리에서 페이지 값만 바꾼다.
// 상대 주소도 받으므로 URL 대신 문자열을 나눠 URLSearchParams로 다룬다.
function pageHref({
  baseUrl,
  queryName,
  page,
}: {
  baseUrl: string;
  queryName: string;
  page: number;
}) {
  const [beforeHash = '', hash] = baseUrl.split(/#(.*)/s);
  const [path = '', query] = beforeHash.split(/\?(.*)/s);
  const params = new URLSearchParams(query);
  params.set(queryName, String(page));
  return `${path}?${params.toString()}${hash === undefined ? '' : `#${hash}`}`;
}

// 현재 페이지를 가운데에 두되, 끝에 닿으면 반대쪽으로 밀어 최대 5개를 채운다.
function visiblePages({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const count = Math.max(0, Math.min(MAX_PAGE_LINKS, totalPages));
  const first = Math.max(
    1,
    Math.min(
      currentPage - Math.floor(MAX_PAGE_LINKS / 2),
      totalPages - count + 1,
    ),
  );
  return Array.from({ length: count }, (_, i) => first + i);
}

function Chevron({ direction }: { direction: 'previous' | 'next' }) {
  return (
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
      <path d={direction === 'previous' ? 'M12 5l-5 5 5 5' : 'M8 5l5 5-5 5'} />
    </svg>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  queryName = 'page',
}: PaginationProps) {
  const href = (page: number) => pageHref({ baseUrl, queryName, page });

  const step = (direction: 'previous' | 'next') => {
    const page = direction === 'previous' ? currentPage - 1 : currentPage + 1;
    const label = direction === 'previous' ? '이전 페이지' : '다음 페이지';
    // 갈 곳이 없으면 href를 빼서 이동과 포커스를 막고, role과 aria-disabled로 비활성 링크임을 알린다.
    if (page < 1 || page > totalPages) {
      return (
        <a
          role="link"
          aria-disabled="true"
          aria-label={label}
          className={cn(itemClass, disabledClass)}
        >
          <Chevron direction={direction} />
        </a>
      );
    }
    return (
      <a
        href={href(page)}
        aria-label={label}
        className={cn(itemClass, linkClass)}
      >
        <Chevron direction={direction} />
      </a>
    );
  };

  return (
    <nav aria-label="페이지">
      <ul className="flex items-center justify-center gap-xs">
        <li>{step('previous')}</li>
        {visiblePages({ currentPage, totalPages }).map((page) => {
          const isCurrent = page === currentPage;
          return (
            <li key={page}>
              <a
                href={href(page)}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(itemClass, isCurrent ? currentClass : linkClass)}
              >
                {page}
              </a>
            </li>
          );
        })}
        <li>{step('next')}</li>
      </ul>
    </nav>
  );
}
