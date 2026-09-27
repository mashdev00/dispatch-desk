import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppShell from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { APP_NAME } from '@/lib/config';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { template: `%s · ${APP_NAME}`, default: APP_NAME },
  description: 'A dispatch tool for a trucking team: see which trips need attention and fix them fast.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
