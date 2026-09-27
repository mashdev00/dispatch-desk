'use client';

import { useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { STATUS_ORDER } from '@/lib/config';
import { useDrafts, useHydrated, useTrips } from '@/lib/store';
import { DEMO_NOW_ISO, isSameDay, toMs } from '@/lib/time';
import { buildRows, compareUrgency, getKpis, rowMatchesQuery, type TableRow } from '@/lib/trips';
import type { RowStatus } from '@/lib/types';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import type { SortDirection } from '@/components/ui/SortHeader';
import AttentionList from './AttentionList';
import KpiStrip, { type KpiFilter } from './KpiStrip';
import TripsFilters from './TripsFilters';
import TripsTable, { type SortColumn } from './TripsTable';
import { rowClient, rowUpdatedAt } from './tripCells';
import styles from './TripsBoard.module.css';

type Sort = { column: SortColumn; direction: Exclude<SortDirection, 'none'> };

const DEFAULT_SORT: Sort = { column: 'urgency', direction: 'ascending' };

const SORT_LABELS: Record<Exclude<SortColumn, 'urgency'>, string> = {
  id: 'Trip',
  client: 'Client',
  deadline: 'Next stop',
  updated: 'Updated',
};

type TripRow = Extract<TableRow, { kind: 'trip' }>;

function sortValue(row: TableRow, column: Exclude<SortColumn, 'urgency'>): string | number {
  switch (column) {
    case 'id':
      return row.id;
    case 'client':
      return rowClient(row);
    case 'deadline':
      return row.kind === 'trip' && row.summary.deadline ? toMs(row.summary.deadline) : Number.POSITIVE_INFINITY;
    case 'updated':
      return toMs(rowUpdatedAt(row));
  }
}

function compareRows(a: TableRow, b: TableRow, { column, direction }: Sort): number {
  if (column === 'urgency') return compareUrgency(a, b);
  const x = sortValue(a, column);
  const y = sortValue(b, column);
  // Rows without a deadline always go last, whatever the direction.
  if (x === Number.POSITIVE_INFINITY || y === Number.POSITIVE_INFINITY) {
    return x === y ? a.id.localeCompare(b.id) : x === Number.POSITIVE_INFINITY ? 1 : -1;
  }
  const result = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
  return (direction === 'ascending' ? result : -result) || a.id.localeCompare(b.id);
}

const isDeliveredToday = (row: TableRow) => {
  if (row.kind !== 'trip' || row.status !== 'delivered') return false;
  const arrived = row.trip.stops[row.trip.stops.length - 1].arrivedAt;
  return arrived !== null && isSameDay(arrived, DEMO_NOW_ISO);
};

const hasOpenExceptions = (row: TableRow): row is TripRow => row.kind === 'trip' && row.open.length > 0;

export default function TripsBoard() {
  const hydrated = useHydrated();
  const trips = useTrips();
  const drafts = useDrafts();
  const tableHeading = useRef<HTMLHeadingElement>(null);

  const [query, setQuery] = useState('');
  const [statuses, setStatuses] = useState<Set<RowStatus>>(new Set());
  const [clientId, setClientId] = useState('');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [deliveredToday, setDeliveredToday] = useState(false);
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);

  const allRows = useMemo(() => buildRows(trips, drafts), [trips, drafts]);
  const kpis = useMemo(() => getKpis(trips), [trips]);
  const attentionRows = useMemo(() => allRows.filter(hasOpenExceptions).sort(compareUrgency), [allRows]);

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0])) as Record<RowStatus, number>;
    for (const row of allRows) counts[row.status]++;
    return counts;
  }, [allRows]);

  const rows = useMemo(() => {
    const filtered = allRows.filter((row) => {
      if (!rowMatchesQuery(row, query)) return false;
      if (statuses.size > 0 && !statuses.has(row.status)) return false;
      if (attentionOnly && !hasOpenExceptions(row)) return false;
      if (deliveredToday && !isDeliveredToday(row)) return false;
      if (clientId) {
        const rowClientId = row.kind === 'trip' ? row.trip.clientId : row.draft.form.clientId;
        if (rowClientId !== clientId) return false;
      }
      return true;
    });
    return filtered.sort((a, b) => compareRows(a, b, sort));
  }, [allRows, query, statuses, attentionOnly, deliveredToday, clientId, sort]);

  const onlyStatus = (status: RowStatus) => statuses.size === 1 && statuses.has(status);
  const activeKpi: KpiFilter | null = deliveredToday
    ? 'delivered_today'
    : attentionOnly
      ? 'attention'
      : onlyStatus('in_transit')
        ? 'in_transit'
        : onlyStatus('scheduled')
          ? 'scheduled'
          : null;

  function selectKpi(filter: KpiFilter) {
    const turningOff = activeKpi === filter;
    setAttentionOnly(!turningOff && filter === 'attention');
    setDeliveredToday(!turningOff && filter === 'delivered_today');
    if (filter === 'in_transit' || filter === 'scheduled') {
      setStatuses(turningOff ? new Set() : new Set([filter]));
    } else if (!turningOff && filter === 'delivered_today') {
      setStatuses(new Set());
    }
  }

  function toggleStatus(status: RowStatus) {
    setDeliveredToday(false);
    setStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function resetFilters() {
    setQuery('');
    setStatuses(new Set());
    setClientId('');
    setAttentionOnly(false);
    setDeliveredToday(false);
  }

  function showAllAttention() {
    resetFilters();
    setAttentionOnly(true);
    setSort(DEFAULT_SORT);
    tableHeading.current?.focus();
  }

  /** Ascending, then descending, then back to most urgent first. */
  function cycleSort(column: SortColumn) {
    setSort((current) => {
      if (current.column !== column) return { column, direction: 'ascending' };
      if (current.direction === 'ascending') return { column, direction: 'descending' };
      return DEFAULT_SORT;
    });
  }

  const directionFor = (column: SortColumn): SortDirection => (sort.column === column ? sort.direction : 'none');

  return (
    <>
      <PageHeader
        title="Trips"
        actions={
          <ButtonLink href="/trips/new" variant="primary" icon={<Plus />}>
            New trip
          </ButtonLink>
        }
      />
      <KpiStrip kpis={hydrated ? kpis : null} active={activeKpi} onSelect={selectKpi} />
      <AttentionList rows={hydrated ? attentionRows : null} onShowAll={showAllAttention} />

      <h2 ref={tableHeading} tabIndex={-1} className={styles.tableTitle}>
        All trips
      </h2>
      <TripsFilters
        query={query}
        onQueryChange={setQuery}
        statuses={statuses}
        onToggleStatus={toggleStatus}
        statusCounts={statusCounts}
        clientId={clientId}
        onClientChange={setClientId}
        attentionOnly={attentionOnly}
        onAttentionOnlyChange={setAttentionOnly}
        otherActive={deliveredToday}
        onReset={resetFilters}
        shown={hydrated ? rows.length : null}
        total={hydrated ? allRows.length : null}
      />
      <div className={styles.sortLine}>
        {sort.column === 'urgency' ? (
          <p>Sorted by: most urgent first</p>
        ) : (
          <>
            <p>
              Sorted by: {SORT_LABELS[sort.column]} ({sort.direction})
            </p>
            <Button variant="ghost" size="sm" onClick={() => setSort(DEFAULT_SORT)}>
              Sort by most urgent
            </Button>
          </>
        )}
        {deliveredToday && <p className={styles.kpiNote}>Showing trips delivered today</p>}
      </div>
      <TripsTable rows={rows} loading={!hydrated} directionFor={directionFor} onSort={cycleSort} onReset={resetFilters} />
    </>
  );
}
