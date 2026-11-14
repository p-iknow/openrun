import type { ReactNode } from 'react';
import { RootLayout } from '@apps-src/_layout/root-layout';
import './globals.css';

export const metadata = {
  title: 'openrun',
};

export default function Layout({ children }: { children: ReactNode }) {
  return <RootLayout>{children}</RootLayout>;
}
