import localFont from 'next/font/local';
import Link from 'next/link';
import { type ReactNode, Suspense } from 'react';
import { HeaderSearch } from '../src/shows/header-search';
import { ShowListSearchForm } from '../src/shows/show-list-search-form';
import { normalizeShowListQuery } from '../src/shows/show-list-query';
import './globals.css';

const pretendard = localFont({
  src: '../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  weight: '45 920',
  display: 'swap',
  variable: '--font-pretendard',
});

export const metadata = {
  title: 'openrun',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="bg-surface text-body text-text antialiased">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-content items-center gap-xl px-lg py-md">
            <Link href="/" className="shrink-0 text-title font-bold">
              openrun
            </Link>
            <div className="flex-1 sm:max-w-[400px]">
              {/* 레이아웃은 404처럼 빌드 때 미리 그리는 화면에도 쓰이는데, 그때는 주소의 쿼리를 알 수 없다.
                  그래서 useSearchParams를 쓰는 HeaderSearch는 그런 화면에서 서버가 그리지 않고 브라우저가 그린다.
                  Suspense는 브라우저로 넘길 범위를 HeaderSearch 하나로 좁힌다. 없으면 화면 전체를 미리 그리지 못해 빌드가 실패한다.
                  미리 그린 HTML에는 생김새가 같은 빈 검색 칸(fallback)을 넣는다. 요청마다 그리는 공연 목록에서는 서버가 검색어까지 채워 그린다. */}
              <Suspense
                fallback={
                  <ShowListSearchForm
                    query={normalizeShowListQuery({}).query}
                  />
                }
              >
                <HeaderSearch />
              </Suspense>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-content px-lg py-xl">{children}</div>
      </body>
    </html>
  );
}
