'use client';

import { SearchX } from 'lucide-react';
import type { TableRow } from '@/lib/trips';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import SortHeader, { type SortDirection } from '@/components/ui/SortHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { cx } from '@/components/ui/cx';
import tableStyles from '@/components/ui/Table.module.css';
import { Attention, NextStop, TripLink, Updated, VehicleDriver, rowClient, rowRoute } from './tripCells';
import styles from './TripsTable.module.css';

export type SortColumn = 'urgency' | 'id' | 'client' | 'deadline' | 'updated';

type TripsTableProps = {
  rows: TableRow[];
  loading: boolean;
  directionFor: (column: SortColumn) => SortDirection;
  onSort: (column: SortColumn) => void;
  onReset: () => void;
};

const SKELETON_ROWS = 8;

export default function TripsTable({ rows, loading, directionFor, onSort, onReset }: TripsTableProps) {
  if (!loading && rows.length === 0) {
    return (
      <div className={tableStyles.container}>
        <EmptyState
          icon={<SearchX />}
          title="No trips match these filters"
          description="Try a different search, or reset the filters to see every trip."
          action={<Button onClick={onReset}>Reset filters</Button>}
        />
      </div>
    );
  }

  return (
    <>
      <div className={cx(tableStyles.container, styles.tableView)} tabIndex={0} role="region" aria-label="Trips table">
        <table className={tableStyles.table}>
          <caption className="visually-hidden">Trips</caption>
          <thead>
            <tr>
              <SortHeader label="Trip" direction={directionFor('id')} onSort={() => onSort('id')} />
              <th scope="col">Status</th>
              <th scope="col">Attention</th>
              <SortHeader label="Client" direction={directionFor('client')} onSort={() => onSort('client')} />
              <th scope="col">Route</th>
              <SortHeader label="Next stop" direction={directionFor('deadline')} onSort={() => onSort('deadline')} />
              <th scope="col" className={styles.wideOnly}>
                Vehicle / driver
              </th>
              <SortHeader
                label="Updated"
                direction={directionFor('updated')}
                onSort={() => onSort('updated')}
                className={styles.wideOnly}
              />
            </tr>
          </thead>
          <tbody aria-busy={loading || undefined}>
            {loading
              ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                  <tr key={i}>
                    {[70, 80, 150, 110, 140, 160, 90, 60].map((width, j) => (
                      <td key={j} className={j >= 6 ? styles.wideOnly : undefined}>
                        <Skeleton width={width} height={14} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={row.id} className={cx(row.kind === 'trip' && row.worst === 'critical' && styles.criticalRow)}>
                    <td className={styles.cellTrip}>
                      <TripLink row={row} />
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td className={styles.cellAttention}>
                      <Attention row={row} />
                    </td>
                    <td>{rowClient(row)}</td>
                    <td>{rowRoute(row)}</td>
                    <td className={styles.cellNext}>
                      <NextStop row={row} />
                    </td>
                    <td className={styles.wideOnly}>
                      <VehicleDriver row={row} />
                    </td>
                    <td className={cx(styles.wideOnly, styles.cellUpdated)}>
                      <Updated row={row} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.cardView} aria-label="Trips" aria-busy={loading || undefined}>
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className={styles.card}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="70%" height={14} />
                <Skeleton width="55%" height={14} />
              </li>
            ))
          : rows.map((row) => (
              <li key={row.id} className={cx(styles.card, row.kind === 'trip' && row.worst === 'critical' && styles.criticalCard)}>
                <div className={styles.cardHeader}>
                  <div className={styles.cellTrip}>
                    <TripLink row={row} />
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                {row.kind === 'trip' && row.worst && <Attention row={row} />}
                <p className={styles.cardRoute}>{rowRoute(row)}</p>
                <p className={styles.secondary}>{rowClient(row)}</p>
                <div className={styles.cardNext}>
                  <NextStop row={row} />
                </div>
              </li>
            ))}
      </ul>
    </>
  );
}
