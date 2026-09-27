'use client';

import { EXCEPTION_ACTIONS, getTripExceptions } from '@/lib/exceptions';
import { stopLabel } from '@/lib/lookups';
import { formatDateTime } from '@/lib/time';
import type { ExceptionActionId, Trip, TripException } from '@/lib/types';
import Button from '@/components/ui/Button';
import InlineAlert from '@/components/ui/InlineAlert';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { cx } from '@/components/ui/cx';
import styles from './ExceptionsPanel.module.css';

type ExceptionsPanelProps = {
  trip: Trip;
  onAction: (exception: TripException, actionId: ExceptionActionId) => void;
};

export default function ExceptionsPanel({ trip, onAction }: ExceptionsPanelProps) {
  const exceptions = getTripExceptions(trip);
  const open = exceptions.filter((e) => !e.handled);
  const handled = exceptions.filter((e) => e.handled);
  const stopName = (stopId: string | null) => {
    const stop = stopId ? trip.stops.find((s) => s.id === stopId) : undefined;
    return stop ? stopLabel(trip, stop) : null;
  };

  return (
    <section aria-labelledby="exceptions-title" className={styles.panel}>
      <h2 id="exceptions-title" className={styles.title}>
        {open.length > 0 ? `Open problems (${open.length})` : 'Problems'}
      </h2>

      {open.length === 0 ? (
        <InlineAlert tone="success">Nothing needs your attention on this trip.</InlineAlert>
      ) : (
        <ul className={styles.list}>
          {open.map((exception) => {
            const where = stopName(exception.stopId);
            return (
              <li key={exception.key} className={cx(styles.card, styles[exception.severity])}>
                <div className={styles.cardHeader}>
                  <SeverityBadge severity={exception.severity} />
                  <h3 className={styles.cardTitle}>{exception.title}</h3>
                  {where && <span className={styles.where}>{where}</span>}
                </div>
                <p className={styles.detail}>{exception.detail}</p>
                <div className={styles.actions}>
                  {exception.actions.map((actionId, index) => (
                    <Button
                      key={actionId}
                      size="sm"
                      variant={index === 0 ? 'primary' : 'secondary'}
                      onClick={() => onAction(exception, actionId)}
                    >
                      {EXCEPTION_ACTIONS[actionId].label}
                    </Button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {handled.length > 0 && (
        <details className={styles.handled}>
          <summary>Handled ({handled.length})</summary>
          <ul className={styles.handledList}>
            {handled.map((exception) => {
              const record = exception.handled!;
              const where = stopName(exception.stopId);
              return (
                <li key={exception.key} className={styles.handledItem}>
                  <div className={styles.cardHeader}>
                    <SeverityBadge severity={exception.severity} handled />
                    <h3 className={styles.cardTitle}>{exception.title}</h3>
                    {where && <span className={styles.where}>{where}</span>}
                  </div>
                  <p>
                    <strong>{record.outcome}</strong>
                    {record.note && ` · ${record.note}`}
                  </p>
                  <p className={styles.meta}>
                    {EXCEPTION_ACTIONS[record.actionId].label} by {record.by} ·{' '}
                    <time dateTime={record.at}>{formatDateTime(record.at)}</time>
                  </p>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
