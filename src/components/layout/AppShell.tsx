'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock } from 'lucide-react';
import { APP_NAME, CURRENT_USER } from '@/lib/config';
import { actions } from '@/lib/store';
import { DEMO_NOW_ISO, formatDateTime, formatTime } from '@/lib/time';
import { initials } from '@/lib/format';
import { cx } from '@/components/ui/cx';
import styles from './AppShell.module.css';

const NAV = [
  { href: '/trips', label: 'Trips', isCurrent: (p: string) => p === '/trips' || (p.startsWith('/trips/') && p !== '/trips/new') },
  { href: '/trips/new', label: 'New trip', isCurrent: (p: string) => p === '/trips/new' || p.startsWith('/drafts/') },
  { href: '/design-system', label: 'Design system', isCurrent: (p: string) => p.startsWith('/design-system') },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function resetDemo() {
    if (window.confirm('Reset the demo data? Every change you made in this browser will be lost.')) {
      actions.resetDemo();
    }
  }

  return (
    <>
      <a href="#main" className={styles.skipLink}>
        Skip to main content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/trips" className={styles.appName}>
            {APP_NAME}
          </Link>
          <nav aria-label="Main" className={styles.nav}>
            <ul className={styles.navList}>
              {NAV.map((item) => {
                const current = item.isCurrent(pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cx(styles.navLink, current && styles.navLinkCurrent)}
                      aria-current={current ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className={styles.tools}>
            <span className={styles.demoTime} title="The demo clock is frozen">
              <Clock size={14} aria-hidden="true" />
              <span className={styles.demoTimeFull}>Demo time: {formatDateTime(DEMO_NOW_ISO)}</span>
              <span className={styles.demoTimeShort}>
                <span className="visually-hidden">Demo time: </span>
                {formatTime(DEMO_NOW_ISO)}
              </span>
            </span>
            <button type="button" className={styles.resetButton} onClick={resetDemo}>
              Reset<span className={styles.resetExtra}> demo data</span>
            </button>
            <span className={styles.user}>
              <span className={styles.avatar} aria-hidden="true">
                {initials(CURRENT_USER.name)}
              </span>
              <span className={styles.userName}>{CURRENT_USER.name}</span>
            </span>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </>
  );
}
