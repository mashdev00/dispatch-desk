import Link from 'next/link';
import { getClient, getDriver, getVehicle, stopLabel } from '@/lib/lookups';
import { formatDateTime, formatRelative, formatTime, formatWindow } from '@/lib/time';
import { getDraftSummary, type TableRow } from '@/lib/trips';
import styles from './TripsTable.module.css';

/** Shared cell content for the table and the phone cards. */

export function rowHref(row: TableRow) {
  return row.kind === 'trip' ? `/trips/${row.id}` : `/drafts/${row.id}`;
}

export function rowClient(row: TableRow) {
  return row.kind === 'trip' ? (getClient(row.trip.clientId)?.name ?? '—') : getDraftSummary(row.draft).clientName;
}

export function rowRoute(row: TableRow) {
  return row.kind === 'trip' ? row.summary.route : getDraftSummary(row.draft).route;
}

export function rowReference(row: TableRow) {
  return row.kind === 'trip' ? row.trip.reference : row.draft.form.reference;
}

export function rowUpdatedAt(row: TableRow) {
  return row.kind === 'trip' ? row.trip.updatedAt : row.draft.updatedAt;
}

export function TripLink({ row }: { row: TableRow }) {
  const reference = rowReference(row);
  return (
    <>
      <Link href={rowHref(row)} className={styles.tripId}>
        {row.id}
      </Link>
      {reference && <span className={styles.secondary}>{reference}</span>}
    </>
  );
}

export function NextStop({ row }: { row: TableRow }) {
  if (row.kind === 'draft') return <span className={styles.secondary}>{getDraftSummary(row.draft).stepLabel}</span>;
  const stop = row.summary.nextStop;
  if (!stop) return <span className={styles.muted}>—</span>;
  return (
    <>
      <span>{stopLabel(row.trip, stop)}</span>
      <span className={styles.secondary}>
        {formatWindow(stop.windowStart, stop.windowEnd)}
        {stop.eta && ` · ETA ${formatTime(stop.eta)}`}
      </span>
    </>
  );
}

export function VehicleDriver({ row }: { row: TableRow }) {
  if (row.kind === 'draft') return <span className={styles.muted}>—</span>;
  const vehicle = getVehicle(row.trip.vehicleId);
  const driver = getDriver(row.trip.driverId);
  const needsOne = row.trip.status === 'scheduled' || row.trip.status === 'in_transit';
  const missing = <span className={needsOne ? styles.notAssigned : styles.muted}>Not assigned</span>;
  return (
    <>
      <span>{vehicle ? vehicle.code : missing}</span>
      <span className={styles.secondary}>{driver ? driver.name : missing}</span>
    </>
  );
}

export function Updated({ row }: { row: TableRow }) {
  const at = rowUpdatedAt(row);
  return (
    <time dateTime={at} title={formatDateTime(at)}>
      {formatRelative(at)}
    </time>
  );
}
