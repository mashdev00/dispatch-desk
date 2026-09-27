'use client';

import Link from 'next/link';
import { CircleCheck } from 'lucide-react';
import type { TableRow } from '@/lib/trips';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import SeverityBadge from '@/components/ui/SeverityBadge';
import Skeleton from '@/components/ui/Skeleton';
import { cx } from '@/components/ui/cx';
import styles from './AttentionList.module.css';

type TripRow = Extract<TableRow, { kind: 'trip' }>;

type AttentionListProps = {
  /** Trip rows with open exceptions, most urgent first. null while loading. */
  rows: TripRow[] | null;
  onShowAll: () => void;
};

const LIMIT = 5;

export default function AttentionList({ rows, onShowAll }: AttentionListProps) {
  if (rows && rows.length === 0) {
    return (
      <section aria-labelledby="attention-title" className={cx(styles.panel, styles.clear)}>
        <CircleCheck size={20} aria-hidden="true" className={styles.clearIcon} />
        <div>
          <h2 id="attention-title" className={styles.title}>
            All trips are on track
          </h2>
          <p className={styles.clearText}>Nothing needs a decision right now.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="attention-title" className={styles.panel}>
      <div className={styles.header}>
        <h2 id="attention-title" className={styles.title}>
          Needs attention
        </h2>
        {rows && rows.length > LIMIT && (
          <Button variant="ghost" size="sm" onClick={onShowAll}>
            Show all {rows.length}
          </Button>
        )}
      </div>
      <ol className={styles.list}>
        {rows
          ? rows.slice(0, LIMIT).map((row) => {
              const [first, ...rest] = row.open;
              return (
                <li key={row.id} className={cx(styles.item, row.worst === 'critical' && styles.critical)}>
                  <div className={styles.badge}>{row.worst && <SeverityBadge severity={row.worst} />}</div>
                  <div className={styles.body}>
                    <p className={styles.problem}>
                      <Link href={`/trips/${row.id}`} className={styles.tripId}>
                        {row.id}
                      </Link>
                      <span className={styles.route}>{row.summary.route}</span>
                    </p>
                    <p className={styles.issue}>
                      <strong>{first.title}.</strong> {first.detail}
                      {rest.length > 0 && <span className={styles.more}> +{rest.length} more</span>}
                    </p>
                  </div>
                  <ButtonLink href={`/trips/${row.id}`} size="sm" className={styles.review}>
                    Review<span className="visually-hidden"> {row.id}</span>
                  </ButtonLink>
                </li>
              );
            })
          : Array.from({ length: 3 }, (_, i) => (
              <li key={i} className={styles.item}>
                <Skeleton width={72} height={20} />
                <div className={styles.body}>
                  <Skeleton width="30%" height={14} />
                  <Skeleton width="70%" height={14} />
                </div>
              </li>
            ))}
      </ol>
    </section>
  );
}
