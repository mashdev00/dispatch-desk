'use client';

import { useEffect, useRef } from 'react';
import type { FormIssue } from '@/lib/types';
import styles from './ErrorSummary.module.css';

type ErrorSummaryProps = { issues: FormIssue[]; fieldId: (field: string) => string };

/** "There is a problem" box. Takes focus when issues appear; each link moves focus to its field. */
export default function ErrorSummary({ issues, fieldId }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hadIssues = useRef(false);

  useEffect(() => {
    const hasIssues = issues.length > 0;
    if (hasIssues && !hadIssues.current) ref.current?.focus();
    hadIssues.current = hasIssues;
  }, [issues]);

  if (issues.length === 0) return null;

  function focusField(event: React.MouseEvent<HTMLAnchorElement>, field: string) {
    const target = document.getElementById(fieldId(field));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: 'center' });
    target.focus({ preventScroll: true });
  }

  return (
    <div ref={ref} tabIndex={-1} aria-labelledby="error-summary-title" className={styles.summary}>
      <h2 id="error-summary-title" className={styles.title}>
        There is a problem
      </h2>
      <ul className={styles.list}>
        {issues.map((issue) => (
          <li key={`${issue.field}-${issue.message}`}>
            <a href={`#${fieldId(issue.field)}`} onClick={(event) => focusField(event, issue.field)}>
              {issue.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
