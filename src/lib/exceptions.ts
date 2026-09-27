/**
 * Exception rules: the things a dispatcher must act on.
 *
 * Each rule looks at one trip and returns zero or more hits. Exceptions are never stored;
 * they are recomputed from the trip at demo time. When a dispatcher responds, a
 * HandledException with the same key is saved on the trip and the exception shows as handled.
 *
 * To add a rule: add its id to ExceptionRuleId in types.ts, then add an entry to EXCEPTION_RULES.
 */
import { CARGO_CATEGORIES, POLICY, VEHICLE_TYPES } from './config';
import { formatKg, formatNumber, formatTemp, formatTempRange } from './format';
import { cityName, getDriver, getVehicle, stopLabel } from './lookups';
import {
  DEMO_NOW_ISO,
  formatDuration,
  formatRelative,
  formatSmart,
  formatTime,
  minutesBetween,
  minutesFromNow,
  toMs,
} from './time';
import type { ExceptionActionId, ExceptionRuleId, Severity, Trip, TripException } from './types';

export const SEVERITIES: Record<Severity, { label: string; rank: number }> = {
  critical: { label: 'Critical', rank: 2 },
  warning: { label: 'Warning', rank: 1 },
};

/**
 * What each suggested action does in the UI:
 * - assign: open the reassign dialog (vehicle and driver)
 * - reschedule: open the reschedule dialog for the exception's stop
 * - record: open the "record action" dialog (pick an outcome, add a note); marks the exception handled
 * - escalate: open the escalate dialog (pick who, add a note); marks the exception handled
 * - document: confirm, then mark the document as received; the exception disappears
 */
export type ActionKind = 'assign' | 'reschedule' | 'record' | 'escalate' | 'document';

export const EXCEPTION_ACTIONS: Record<ExceptionActionId, { label: string; kind: ActionKind }> = {
  assign: { label: 'Reassign vehicle or driver', kind: 'assign' },
  reschedule: { label: 'Reschedule stop', kind: 'reschedule' },
  notify_client: { label: 'Notify client', kind: 'record' },
  contact_driver: { label: 'Contact driver', kind: 'record' },
  escalate: { label: 'Escalate', kind: 'escalate' },
  record_action: { label: 'Record action', kind: 'record' },
  plan_rest: { label: 'Plan rest stop', kind: 'record' },
  mark_note_received: { label: 'Mark consignment note received', kind: 'document' },
  mark_pod_received: { label: 'Mark POD received', kind: 'document' },
};

interface RuleHit {
  severity: Severity;
  detail: string;
  stopId: string | null;
}

export interface ExceptionRule {
  id: ExceptionRuleId;
  title: string;
  /** When the rule fires, in plain words. Good for help text and the design-system page. */
  description: string;
  actions: ExceptionActionId[];
  /** Choices offered in the "record action" dialog. The last one should be "Other". */
  outcomes: string[];
  check: (trip: Trip) => RuleHit[];
}

const isActive = (trip: Trip) => trip.status === 'scheduled' || trip.status === 'in_transit';

/** Wrong-vehicle problems are critical once the trip has started or pickup is close. */
function vehicleProblemSeverity(trip: Trip): Severity {
  if (trip.status === 'in_transit') return 'critical';
  return minutesFromNow(trip.stops[0].windowStart) <= POLICY.vehicleProblemCriticalHours * 60
    ? 'critical'
    : 'warning';
}

/** Rules in the order they should be listed when severity is equal. */
export const EXCEPTION_RULES: ExceptionRule[] = [
  {
    id: 'temp_excursion',
    title: 'Temperature out of range',
    description: 'The latest reefer reading is outside the cargo’s allowed band.',
    actions: ['contact_driver', 'escalate', 'record_action'],
    outcomes: [
      'Driver checked the unit, back in range',
      'Rerouting to the nearest cold store',
      'Moving the load to another reefer',
      'Client asked to return the load',
      'Other',
    ],
    check: (trip) => {
      const range = trip.cargo.tempRangeC;
      const log = trip.temperatureLog;
      if (trip.status !== 'in_transit' || !range || log.length === 0) return [];
      const outside = (c: number) => c < range.min || c > range.max;
      const latest = log[log.length - 1];
      if (!outside(latest.celsius)) return [];
      let first = log.length - 1;
      while (first > 0 && outside(log[first - 1].celsius)) first--;
      const since = log[first].at;
      const minutes = minutesBetween(since, DEMO_NOW_ISO);
      const delta = latest.celsius > range.max ? latest.celsius - range.max : range.min - latest.celsius;
      const severity: Severity =
        minutes >= POLICY.tempCriticalMinutes || delta >= POLICY.tempCriticalDeltaC ? 'critical' : 'warning';
      const duration = minutes < 1 ? 'Just went out of range' : `Out of range for ${formatDuration(minutes)}, since ${formatTime(since)}`;
      return [
        {
          severity,
          stopId: null,
          detail: `${formatTemp(latest.celsius)} now; allowed ${formatTempRange(range)}. ${duration}.`,
        },
      ];
    },
  },
  {
    id: 'missed_window',
    title: 'Missed time window',
    description: 'A stop’s time window has closed and the truck hasn’t arrived.',
    actions: ['contact_driver', 'reschedule', 'notify_client', 'escalate'],
    outcomes: [
      'Driver reached, new time agreed with the client',
      'Moved to the next available window',
      'Vehicle broke down, replacement arranged',
      'Other',
    ],
    check: (trip) => {
      if (!isActive(trip)) return [];
      return trip.stops
        .filter((stop) => !stop.arrivedAt && minutesFromNow(stop.windowEnd) < 0)
        .map((stop) => {
          const eta = stop.eta
            ? ` ETA now ${formatSmart(stop.eta)}.`
            : trip.status === 'in_transit'
              ? ' No ETA: the truck isn’t reporting its position.'
              : '';
          return {
            severity: 'critical' as const,
            stopId: stop.id,
            detail: `${stopLabel(trip, stop)}: window closed at ${formatTime(stop.windowEnd)} (${formatDuration(minutesFromNow(stop.windowEnd))} ago) and the truck hasn’t arrived.${eta}`,
          };
        });
    },
  },
  {
    id: 'tracking_stale',
    title: 'Tracking lost',
    description: `No position from the truck for more than ${POLICY.trackingWarnMinutes} minutes.`,
    actions: ['contact_driver', 'escalate'],
    outcomes: ['Driver reached, phone or GPS problem, location confirmed', 'Driver not reachable', 'Other'],
    check: (trip) => {
      if (trip.status !== 'in_transit' || !trip.tracking) return [];
      const silent = -minutesFromNow(trip.tracking.lastPingAt);
      if (silent <= POLICY.trackingWarnMinutes) return [];
      return [
        {
          severity: silent > POLICY.trackingCriticalMinutes ? 'critical' : 'warning',
          stopId: null,
          detail: `No position for ${formatDuration(silent)}. Last seen at ${formatTime(trip.tracking.lastPingAt)}, ${trip.tracking.locationLabel}.`,
        },
      ];
    },
  },
  {
    id: 'late_risk',
    title: 'Late arrival risk',
    description: 'The latest ETA for a stop is after its time window closes.',
    actions: ['notify_client', 'reschedule', 'record_action'],
    outcomes: [
      'Client accepted the new ETA',
      'Delivery moved to a later window',
      'Extra driver or faster route arranged',
      'Other',
    ],
    check: (trip) => {
      if (trip.status !== 'in_transit') return [];
      return trip.stops
        .filter(
          (stop) =>
            !stop.arrivedAt &&
            stop.eta !== null &&
            minutesFromNow(stop.windowEnd) >= 0 &&
            toMs(stop.eta) > toMs(stop.windowEnd),
        )
        .map((stop) => {
          const late = minutesBetween(stop.windowEnd, stop.eta as string);
          return {
            severity: late > POLICY.lateCriticalMinutes ? ('critical' as const) : ('warning' as const),
            stopId: stop.id,
            detail: `ETA ${formatSmart(stop.eta as string)} at ${cityName(stop.cityId)} is ${formatDuration(late)} after the window closes (${formatTime(stop.windowEnd)}).`,
          };
        });
    },
  },
  {
    id: 'driver_hours',
    title: 'Driver hours limit',
    description: `The driver is close to or over the ${POLICY.maxDrivingHours24h}-hour daily driving limit.`,
    actions: ['plan_rest', 'assign'],
    outcomes: ['Rest stop planned, ETA updated', 'Relief driver arranged', 'Other'],
    check: (trip) => {
      if (trip.status !== 'in_transit') return [];
      const driver = getDriver(trip.driverId);
      if (!driver || driver.drivingHoursLast24h < POLICY.drivingHoursWarn) return [];
      return [
        {
          severity: driver.drivingHoursLast24h >= POLICY.maxDrivingHours24h ? 'critical' : 'warning',
          stopId: null,
          detail: `${driver.name} has driven ${formatNumber(driver.drivingHoursLast24h, 1)} h in the last 24 h. The company limit is ${POLICY.maxDrivingHours24h} h.`,
        },
      ];
    },
  },
  {
    id: 'unassigned',
    title: 'Vehicle or driver missing',
    description: `A scheduled trip has no vehicle or driver within ${POLICY.unassignedWarnHours} hours of pickup.`,
    actions: ['assign'],
    outcomes: [],
    check: (trip) => {
      if (trip.status !== 'scheduled') return [];
      const missing = [!trip.vehicleId ? 'vehicle' : null, !trip.driverId ? 'driver' : null].filter(Boolean);
      if (missing.length === 0) return [];
      const pickup = trip.stops[0].windowStart;
      const minutes = minutesFromNow(pickup);
      if (minutes > POLICY.unassignedWarnHours * 60) return [];
      const when =
        minutes >= 0
          ? `Pickup starts ${formatRelative(pickup)} (${formatSmart(pickup)})`
          : `Pickup window opened ${formatDuration(minutes)} ago`;
      return [
        {
          severity: minutes <= POLICY.unassignedCriticalHours * 60 ? 'critical' : 'warning',
          stopId: null,
          detail: `No ${missing.join(' or ')} assigned. ${when}.`,
        },
      ];
    },
  },
  {
    id: 'reefer_mismatch',
    title: 'Needs a refrigerated truck',
    description: 'Temperature-controlled cargo is on a vehicle without refrigeration.',
    actions: ['assign'],
    outcomes: [],
    check: (trip) => {
      const range = trip.cargo.tempRangeC;
      const vehicle = getVehicle(trip.vehicleId);
      if (!isActive(trip) || !range || !vehicle || vehicle.reefer) return [];
      return [
        {
          severity: vehicleProblemSeverity(trip),
          stopId: null,
          detail: `${CARGO_CATEGORIES[trip.cargo.category].label} cargo must stay at ${formatTempRange(range)}, but ${vehicle.code} (${VEHICLE_TYPES[vehicle.type].label}) isn’t refrigerated.`,
        },
      ];
    },
  },
  {
    id: 'over_capacity',
    title: 'Over vehicle capacity',
    description: 'The load is heavier than the assigned vehicle can carry.',
    actions: ['assign', 'record_action'],
    outcomes: ['Load reduced to fit the vehicle', 'Load split across two vehicles', 'Other'],
    check: (trip) => {
      const vehicle = getVehicle(trip.vehicleId);
      if (!isActive(trip) || !vehicle || trip.cargo.weightKg <= vehicle.capacityKg) return [];
      return [
        {
          severity: vehicleProblemSeverity(trip),
          stopId: null,
          detail: `Load is ${formatKg(trip.cargo.weightKg)} but ${vehicle.code} (${VEHICLE_TYPES[vehicle.type].label}) carries up to ${formatKg(vehicle.capacityKg)}: ${formatKg(trip.cargo.weightKg - vehicle.capacityKg)} over.`,
        },
      ];
    },
  },
  {
    id: 'detention',
    title: 'Long wait at stop',
    description: `The truck has waited at a stop longer than the ${formatDuration(POLICY.detentionFreeMinutes)} free time (detention).`,
    actions: ['notify_client', 'record_action'],
    outcomes: [
      'Client told that detention charges apply',
      'Loading or unloading has started',
      'Leaving with a partial load (client approved)',
      'Other',
    ],
    check: (trip) => {
      if (trip.status !== 'in_transit') return [];
      return trip.stops.flatMap((stop) => {
        if (!stop.arrivedAt || stop.departedAt) return [];
        // The clock starts at arrival, or at the window start if the truck arrived early.
        const start = toMs(stop.arrivedAt) > toMs(stop.windowStart) ? stop.arrivedAt : stop.windowStart;
        const waited = minutesBetween(start, DEMO_NOW_ISO);
        if (waited <= POLICY.detentionFreeMinutes) return [];
        return [
          {
            severity: waited > POLICY.detentionCriticalMinutes ? ('critical' as const) : ('warning' as const),
            stopId: stop.id,
            detail: `Waiting at ${stop.siteName} for ${formatDuration(waited)}; free time is ${formatDuration(POLICY.detentionFreeMinutes)}.`,
          },
        ];
      });
    },
  },
  {
    id: 'missing_consignment_note',
    title: 'Consignment note missing',
    description: 'The truck left the pickup without a consignment note (bilty) on file.',
    actions: ['mark_note_received', 'contact_driver'],
    outcomes: ['Driver will upload a photo at the next stop', 'Other'],
    check: (trip) => {
      const pickup = trip.stops[0];
      if (trip.status !== 'in_transit' || !pickup.departedAt || trip.documents.consignmentNote !== 'missing') return [];
      return [
        {
          severity: 'warning',
          stopId: null,
          detail: `Left ${cityName(pickup.cityId)} at ${formatSmart(pickup.departedAt)} with no consignment note (bilty) on file.`,
        },
      ];
    },
  },
  {
    id: 'pod_overdue',
    title: 'POD overdue',
    description: `No signed proof of delivery ${POLICY.podOverdueHours} hours after delivery.`,
    actions: ['mark_pod_received', 'notify_client'],
    outcomes: ['Consignee will email a scan', 'Driver will bring the paper copy', 'Other'],
    check: (trip) => {
      const last = trip.stops[trip.stops.length - 1];
      if (trip.status !== 'delivered' || trip.documents.pod !== 'missing' || !last.arrivedAt) return [];
      const since = -minutesFromNow(last.arrivedAt);
      if (since <= POLICY.podOverdueHours * 60) return [];
      return [
        {
          severity: 'warning',
          stopId: null,
          detail: `Delivered ${formatSmart(last.arrivedAt)} (${formatDuration(since)} ago); no signed POD yet.`,
        },
      ];
    },
  },
];

export const RULES_BY_ID = Object.fromEntries(EXCEPTION_RULES.map((rule) => [rule.id, rule])) as Record<
  ExceptionRuleId,
  ExceptionRule
>;

const cache = new WeakMap<Trip, TripException[]>();

/**
 * All exceptions for a trip: open ones first, then handled; critical before warning.
 * Results are cached per trip object, so calling this in render is cheap.
 */
export function getTripExceptions(trip: Trip): TripException[] {
  const cached = cache.get(trip);
  if (cached) return cached;
  const result: TripException[] = [];
  for (const rule of EXCEPTION_RULES) {
    for (const hit of rule.check(trip)) {
      const key = `${rule.id}:${hit.stopId ?? 'trip'}`;
      result.push({
        key,
        ruleId: rule.id,
        severity: hit.severity,
        title: rule.title,
        detail: hit.detail,
        stopId: hit.stopId,
        actions: rule.actions,
        outcomes: rule.outcomes,
        handled: trip.handled.find((h) => h.key === key) ?? null,
      });
    }
  }
  // Array.prototype.sort is stable, so rule order is kept inside each group.
  result.sort(
    (a, b) =>
      Number(Boolean(a.handled)) - Number(Boolean(b.handled)) ||
      SEVERITIES[b.severity].rank - SEVERITIES[a.severity].rank,
  );
  cache.set(trip, result);
  return result;
}

/** Only the exceptions nobody has responded to yet. */
export function getOpenExceptions(trip: Trip): TripException[] {
  return getTripExceptions(trip).filter((e) => !e.handled);
}

/** The most serious severity in a list, or null when the list is empty. */
export function worstSeverity(exceptions: TripException[]): Severity | null {
  if (exceptions.some((e) => e.severity === 'critical')) return 'critical';
  return exceptions.length > 0 ? 'warning' : null;
}
