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
              {/* useSearchParams는 정적으로 그리는 화면(404 등)에서 Suspense가 필요하다. 그동안 빈 검색 칸을 보인다. */}
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
