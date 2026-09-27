/**
 * Read-only helpers for screens: summaries, table rows, sorting, search and KPIs.
 * Nothing here changes data; changes go through `actions` in store.ts.
 */
import { CARGO_CATEGORIES, STATUS_ORDER } from './config';
import { SEVERITIES, getOpenExceptions, worstSeverity } from './exceptions';
import { cityName, getClient, getDriver, getVehicle } from './lookups';
import { DEMO_NOW_ISO, isSameDay, toMs } from './time';
import type { RowStatus, Severity, Stop, Trip, TripDraft, TripException } from './types';
import { WIZARD_STEPS } from './wizard';

export interface TripSummary {
  origin: string;
  destination: string;
  /** Stops between the pickup and the final drop. */
  extraStops: number;
  /** "Lahore → Sialkot" or "Lahore → Sialkot (+1 stop)" */
  route: string;
  /** First stop the truck hasn't reached yet. null once delivered or cancelled. */
  nextStop: Stop | null;
  /** When the next stop's window closes. Use it to sort by "what's due first". */
  deadline: string | null;
  stopsDone: number;
  stopsTotal: number;
}

export function getTripSummary(trip: Trip): TripSummary {
  const first = trip.stops[0];
  const last = trip.stops[trip.stops.length - 1];
  const extraStops = Math.max(0, trip.stops.length - 2);
  const origin = cityName(first.cityId);
  const destination = cityName(last.cityId);
  const isActive = trip.status === 'scheduled' || trip.status === 'in_transit';
  const nextStop = isActive ? (trip.stops.find((s) => !s.arrivedAt) ?? null) : null;
  return {
    origin,
    destination,
    extraStops,
    route: `${origin} → ${destination}${extraStops ? ` (+${extraStops} ${extraStops === 1 ? 'stop' : 'stops'})` : ''}`,
    nextStop,
    deadline: nextStop?.windowEnd ?? null,
    stopsDone: trip.stops.filter((s) => s.arrivedAt).length,
    stopsTotal: trip.stops.length,
  };
}

/** Delivered trips only: did the truck reach the final stop before its window closed? */
export function isOnTime(trip: Trip): boolean | null {
  const last = trip.stops[trip.stops.length - 1];
  if (trip.status !== 'delivered' || !last.arrivedAt) return null;
  return toMs(last.arrivedAt) <= toMs(last.windowEnd);
}

// ---------------------------------------------------------------------------
// Table rows
// ---------------------------------------------------------------------------

/** One row of the trips table: a real trip, or a draft that hasn't been submitted yet. */
export type TableRow =
  | {
      kind: 'trip';
      id: string;
      status: RowStatus;
      trip: Trip;
      summary: TripSummary;
      open: TripException[];
      worst: Severity | null;
    }
  | { kind: 'draft'; id: string; status: 'draft'; draft: TripDraft };

export function buildRows(trips: Trip[], drafts: TripDraft[]): TableRow[] {
  const tripRows: TableRow[] = trips.map((trip) => {
    const open = getOpenExceptions(trip);
    return {
      kind: 'trip',
      id: trip.id,
      status: trip.status,
      trip,
      summary: getTripSummary(trip),
      open,
      worst: worstSeverity(open),
    };
  });
  const draftRows: TableRow[] = drafts.map((draft) => ({ kind: 'draft', id: draft.id, status: 'draft', draft }));
  return [...tripRows, ...draftRows];
}

const severityRank = (row: TableRow) => (row.kind === 'trip' && row.worst ? SEVERITIES[row.worst].rank : 0);
const deadlineMs = (row: TableRow) =>
  row.kind === 'trip' && row.summary.deadline ? toMs(row.summary.deadline) : Number.POSITIVE_INFINITY;

/** Most urgent first: worst open exception, then the earliest closing window, then status. */
export function compareUrgency(a: TableRow, b: TableRow): number {
  return (
    severityRank(b) - severityRank(a) ||
    deadlineMs(a) - deadlineMs(b) ||
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
    a.id.localeCompare(b.id)
  );
}

/** Case-insensitive search across ids, client, cargo, cities, sites, vehicle and driver. */
export function rowMatchesQuery(row: TableRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fields: string[] = [row.id];
  if (row.kind === 'trip') {
    const { trip } = row;
    const vehicle = getVehicle(trip.vehicleId);
    fields.push(
      trip.reference,
      getClient(trip.clientId)?.name ?? '',
      trip.cargo.description,
      CARGO_CATEGORIES[trip.cargo.category].label,
      vehicle?.code ?? '',
      vehicle?.plate ?? '',
      getDriver(trip.driverId)?.name ?? '',
      ...trip.stops.flatMap((s) => [cityName(s.cityId), s.siteName]),
    );
  } else {
    const { form } = row.draft;
    fields.push(
      form.reference,
      getClient(form.clientId)?.name ?? '',
      form.cargoDescription,
      ...form.stops.flatMap((s) => [cityName(s.cityId), s.siteName]),
    );
  }
  return fields.some((field) => field.toLowerCase().includes(q));
}

/** What the table can show for a draft: whatever has been filled in so far. */
export function getDraftSummary(draft: TripDraft): { clientName: string; route: string; stepLabel: string } {
  const { form } = draft;
  const cities = form.stops.map((s) => s.cityId).filter(Boolean);
  const route =
    cities.length >= 2
      ? `${cityName(cities[0])} → ${cityName(cities[cities.length - 1])}`
      : cities.length === 1
        ? `${cityName(cities[0])} → …`
        : '—';
  const step = WIZARD_STEPS.find((s) => s.step === draft.step);
  return {
    clientName: getClient(form.clientId)?.name ?? '—',
    route,
    stepLabel: `Step ${draft.step} of ${WIZARD_STEPS.length}: ${step?.label ?? ''}`,
  };
}

export interface SiteOption {
  cityId: string;
  siteName: string;
  address: string;
  contactName: string;
  contactPhone: string;
}

/** Sites a client has used on earlier trips, for a "use a saved site" picker in the wizard. */
export function getClientSites(trips: Trip[], clientId: string): SiteOption[] {
  const sites = new Map<string, SiteOption>();
  for (const trip of trips) {
    if (trip.clientId !== clientId) continue;
    for (const { cityId, siteName, address, contactName, contactPhone } of trip.stops) {
      if (!sites.has(siteName)) sites.set(siteName, { cityId, siteName, address, contactName, contactPhone });
    }
  }
  return [...sites.values()].sort((a, b) => a.siteName.localeCompare(b.siteName));
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

export interface Kpis {
  inTransit: number;
  scheduled: number;
  /** Trips with at least one open exception. */
  needsAttention: number;
  /** Trips whose worst open exception is critical. */
  critical: number;
  deliveredToday: number;
  /** Share of delivered trips that arrived inside the final window. null when nothing is delivered. */
  onTimeRate: number | null;
  deliveredTotal: number;
}

export function getKpis(trips: Trip[]): Kpis {
  let needsAttention = 0;
  let critical = 0;
  for (const trip of trips) {
    const worst = worstSeverity(getOpenExceptions(trip));
    if (worst) needsAttention++;
    if (worst === 'critical') critical++;
  }
  const delivered = trips.filter((t) => t.status === 'delivered');
  const onTime = delivered.filter((t) => isOnTime(t)).length;
  return {
    inTransit: trips.filter((t) => t.status === 'in_transit').length,
    scheduled: trips.filter((t) => t.status === 'scheduled').length,
    needsAttention,
    critical,
    deliveredToday: delivered.filter((t) => {
      const arrived = t.stops[t.stops.length - 1].arrivedAt;
      return arrived !== null && isSameDay(arrived, DEMO_NOW_ISO);
    }).length,
    onTimeRate: delivered.length ? onTime / delivered.length : null,
    deliveredTotal: delivered.length,
  };
}
