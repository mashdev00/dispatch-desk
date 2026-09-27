'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { STATUS_ORDER } from '@/lib/config';
import { useDrafts, useHydrated, useTrips } from '@/lib/store';
import { toMs } from '@/lib/time';
import { buildRows, rowMatchesQuery, type TableRow } from '@/lib/trips';
import type { RowStatus } from '@/lib/types';
import PageHeader from '@/components/layout/PageHeader';
import ButtonLink from '@/components/ui/ButtonLink';
import type { SortDirection } from '@/components/ui/SortHeader';
import TripsFilters from './TripsFilters';
import TripsTable, { type SortColumn } from './TripsTable';
import { rowClient, rowUpdatedAt } from './tripCells';

type Sort = { column: SortColumn; direction: Exclude<SortDirection, 'none'> };

const DEFAULT_SORT: Sort = { column: 'id', direction: 'descending' };

function sortValue(row: TableRow, column: SortColumn): string | number {
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
  const x = sortValue(a, column);
  const y = sortValue(b, column);
  // Rows without a deadline always go last, whatever the direction.
  if (x === Number.POSITIVE_INFINITY || y === Number.POSITIVE_INFINITY) {
    return x === y ? a.id.localeCompare(b.id) : x === Number.POSITIVE_INFINITY ? 1 : -1;
  }
  const result = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
  return (direction === 'ascending' ? result : -result) || a.id.localeCompare(b.id);
}

export default function TripsBoard() {
  const hydrated = useHydrated();
  const trips = useTrips();
  const drafts = useDrafts();

  const [query, setQuery] = useState('');
  const [statuses, setStatuses] = useState<Set<RowStatus>>(new Set());
  const [clientId, setClientId] = useState('');
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);

  const allRows = useMemo(() => buildRows(trips, drafts), [trips, drafts]);

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0])) as Record<RowStatus, number>;
    for (const row of allRows) counts[row.status]++;
    return counts;
  }, [allRows]);

  const rows = useMemo(() => {
    const filtered = allRows.filter((row) => {
      if (!rowMatchesQuery(row, query)) return false;
      if (statuses.size > 0 && !statuses.has(row.status)) return false;
      if (clientId) {
        const rowClientId = row.kind === 'trip' ? row.trip.clientId : row.draft.form.clientId;
        if (rowClientId !== clientId) return false;
      }
      return true;
    });
    return filtered.sort((a, b) => compareRows(a, b, sort));
  }, [allRows, query, statuses, clientId, sort]);

  function toggleStatus(status: RowStatus) {
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
  }

  /** Ascending, then descending, then back to the default order. */
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
      <TripsFilters
        query={query}
        onQueryChange={setQuery}
        statuses={statuses}
        onToggleStatus={toggleStatus}
        statusCounts={statusCounts}
        clientId={clientId}
        onClientChange={setClientId}
        onReset={resetFilters}
        shown={hydrated ? rows.length : null}
        total={hydrated ? allRows.length : null}
      />
      <TripsTable
        rows={rows}
        loading={!hydrated}
        directionFor={directionFor}
        onSort={cycleSort}
        onReset={resetFilters}
      />
    </>
  );
}
