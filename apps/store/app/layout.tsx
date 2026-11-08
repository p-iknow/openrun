import localFont from 'next/font/local';
import Link from 'next/link';
import type { ReactNode } from 'react';
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
        <p className="bg-primary-subtle px-lg py-sm text-center text-body-sm text-primary">
          테스트 결제만 가능한 가상 서비스입니다. 실제로 결제되지 않습니다.
        </p>
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-content items-center px-lg py-md">
            <Link href="/" className="text-title font-bold">
              openrun
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-content px-lg py-xl">{children}</div>
      </body>
    </html>
  );
}
