'use client';

/**
 * App state: trips and drafts, saved in localStorage so changes survive a refresh.
 *
 * Read with the hooks (useTrips, useTrip, useDrafts, useDraft, useHydrated).
 * Change with the functions on `actions`. Never edit a trip object directly.
 *
 * How it works: the state lives in this module, outside React. Components subscribe with
 * useSyncExternalStore. On the server (and during hydration) everyone sees the seed data from
 * src/data, so the HTML always matches; right after hydration React switches to the saved state.
 * Angular comparison: think of it as a small singleton service holding a BehaviorSubject.
 */
import { useSyncExternalStore } from 'react';
import draftsData from '../data/drafts.json';
import tripsData from '../data/trips.json';
import { CURRENT_ACTOR, ESCALATION_TARGETS } from './config';
import type { EscalationTargetId } from './config';
import { EXCEPTION_ACTIONS, RULES_BY_ID, getOpenExceptions } from './exceptions';
import { getDriver, getVehicle, vehicleLabel } from './lookups';
import { DEMO_NOW_MS, formatWindow, toMs, toPkIso } from './time';
import type {
  ActivityKind,
  ExceptionActionId,
  ExceptionRuleId,
  FormIssue,
  Trip,
  TripDocuments,
  TripDraft,
  TripForm,
  WizardStep,
} from './types';
import { formToTrip, validateTripForm } from './wizard';

export interface AppState {
  version: number;
  trips: Trip[];
  drafts: TripDraft[];
  /** Time of the last user action, so new events never go backwards after a reload. */
  lastActionAt: string | null;
  /** Last draft number handed out, so a deleted draft's id is never reused. */
  lastDraftNumber: number;
}

const STORAGE_KEY = 'dispatch-desk-state';
/** Bump this when the data shape changes; old saved state is then replaced by the seed. */
const STATE_VERSION = 1;

function seedState(): AppState {
  const drafts = draftsData as TripDraft[];
  return {
    version: STATE_VERSION,
    trips: tripsData as Trip[],
    drafts,
    lastActionAt: null,
    lastDraftNumber: nextNumber(drafts.map((d) => d.id), 'DRF-', 1001) - 1,
  };
}

/** The next free number after the highest existing id, e.g. TRP-24151 → 24152. */
function nextNumber(ids: string[], prefix: string, first: number): number {
  const numbers = ids.map((id) => Number(id.replace(prefix, ''))).filter(Number.isFinite);
  return numbers.length ? Math.max(...numbers) + 1 : first;
}

const SERVER_STATE = seedState();
let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as AppState;
      if (
        saved?.version === STATE_VERSION &&
        Array.isArray(saved.trips) &&
        Array.isArray(saved.drafts) &&
        typeof saved.lastDraftNumber === 'number'
      )
        return saved;
    }
  } catch {
    // Storage blocked or corrupt: fall back to the seed data.
  }
  return seedState();
}

function getSnapshot(): AppState {
  if (state === null) state = load();
  return state;
}

const getServerSnapshot = () => SERVER_STATE;

function emit() {
  for (const listener of listeners) listener();
}

/** Keeps several open tabs in sync. */
function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  state = load();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

function commit(next: AppState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
  emit();
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Current state outside React (event handlers, tests). In components, use the hooks instead. */
export function getState(): AppState {
  return getSnapshot();
}

export const useTrips = () => useAppState().trips;
export const useDrafts = () => useAppState().drafts;
export const useTrip = (id: string) => useAppState().trips.find((t) => t.id === id);
export const useDraft = (id: string) => useAppState().drafts.find((d) => d.id === id);

const noopSubscribe = () => () => {};

/**
 * false during server render and hydration, true after. A trip created in this browser
 * doesn't exist on the server, so show a skeleton until this is true before saying "not found".
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// ---------------------------------------------------------------------------
// Internals for actions
// ---------------------------------------------------------------------------

/** Demo time plus the real time since the page opened; always after the previous action. */
function nextTimestamp(current: AppState): string {
  const elapsed = typeof performance === 'undefined' ? 0 : Math.round(performance.now());
  const afterLast = current.lastActionAt ? toMs(current.lastActionAt) + 60_000 : 0;
  return toPkIso(Math.max(DEMO_NOW_MS + elapsed, afterLast));
}

function withEvent(trip: Trip, at: string, kind: ActivityKind, message: string, actor = CURRENT_ACTOR): Trip {
  const event = { id: `${trip.id}-a${trip.activity.length + 1}`, at, actor, kind, message };
  return { ...trip, activity: [...trip.activity, event] };
}

/** " Resolves: Over vehicle capacity." when a change made open exceptions disappear. */
function resolvedSuffix(before: Trip, after: Trip): string {
  const afterKeys = new Set(getOpenExceptions(after).map((e) => e.key));
  const gone = getOpenExceptions(before).filter((e) => !afterKeys.has(e.key));
  return gone.length ? ` Resolves: ${gone.map((e) => e.title).join(', ')}.` : '';
}

const withNote = (message: string, note?: string) => (note?.trim() ? `${message} Note: ${note.trim()}` : message);

function updateTrip(tripId: string, change: (trip: Trip, at: string) => Trip) {
  const current = getSnapshot();
  const at = nextTimestamp(current);
  let found = false;
  const trips = current.trips.map((trip) => {
    if (trip.id !== tripId) return trip;
    found = true;
    return { ...change(trip, at), updatedAt: at };
  });
  if (found) commit({ ...current, trips, lastActionAt: at });
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export const actions = {
  /** Change the vehicle and/or driver. Pass null to unassign. */
  assign(tripId: string, input: { vehicleId: string | null; driverId: string | null; note?: string }) {
    updateTrip(tripId, (trip, at) => {
      const next = { ...trip, vehicleId: input.vehicleId, driverId: input.driverId };
      const changes: string[] = [];
      if (trip.vehicleId !== input.vehicleId) {
        const vehicle = getVehicle(input.vehicleId);
        changes.push(vehicle ? `vehicle ${vehicleLabel(vehicle)}` : 'no vehicle');
      }
      if (trip.driverId !== input.driverId) changes.push(`driver ${getDriver(input.driverId)?.name ?? 'none'}`);
      if (changes.length === 0) return trip;
      const message = withNote(`Assigned ${changes.join(' and ')}.${resolvedSuffix(trip, next)}`, input.note);
      return withEvent(next, at, 'assigned', message);
    });
  },

  /** Give a stop a new time window (after talking to the client). */
  rescheduleStop(tripId: string, stopId: string, input: { windowStart: string; windowEnd: string; note: string }) {
    updateTrip(tripId, (trip, at) => {
      const stop = trip.stops.find((s) => s.id === stopId);
      if (!stop) return trip;
      const next = {
        ...trip,
        stops: trip.stops.map((s) =>
          s.id === stopId ? { ...s, windowStart: input.windowStart, windowEnd: input.windowEnd } : s,
        ),
      };
      const message = `Rescheduled ${stop.siteName} from ${formatWindow(stop.windowStart, stop.windowEnd)} to ${formatWindow(input.windowStart, input.windowEnd)}.${resolvedSuffix(trip, next)}`;
      return withEvent(next, at, 'rescheduled', withNote(message, input.note));
    });
  },

  /** Record what the dispatcher did about an exception. It then shows as handled. */
  recordAction(tripId: string, exceptionKey: string, input: { actionId: ExceptionActionId; outcome: string; note: string }) {
    updateTrip(tripId, (trip, at) => {
      const [ruleId, stopPart] = exceptionKey.split(':') as [ExceptionRuleId, string];
      const rule = RULES_BY_ID[ruleId];
      if (!rule) return trip;
      const handled = trip.handled.filter((h) => h.key !== exceptionKey);
      const next = {
        ...trip,
        handled: [
          ...handled,
          {
            key: exceptionKey,
            ruleId,
            stopId: stopPart === 'trip' ? null : stopPart,
            actionId: input.actionId,
            outcome: input.outcome,
            note: input.note.trim(),
            by: CURRENT_ACTOR,
            at,
          },
        ],
      };
      const message = `${EXCEPTION_ACTIONS[input.actionId].label} (${rule.title}): ${input.outcome}.`;
      return withEvent(next, at, 'exception', withNote(message, input.note));
    });
  },

  /** Hand the problem to someone senior. With an exceptionKey, the exception shows as handled. */
  escalate(tripId: string, input: { to: EscalationTargetId; note: string; exceptionKey?: string | null }) {
    const target = ESCALATION_TARGETS.find((t) => t.id === input.to);
    if (!target) return;
    updateTrip(tripId, (trip, at) => {
      let next = trip;
      let about = '';
      if (input.exceptionKey) {
        const [ruleId, stopPart] = input.exceptionKey.split(':') as [ExceptionRuleId, string];
        const rule = RULES_BY_ID[ruleId];
        if (rule) {
          about = ` about “${rule.title}”`;
          next = {
            ...trip,
            handled: [
              ...trip.handled.filter((h) => h.key !== input.exceptionKey),
              {
                key: input.exceptionKey,
                ruleId,
                stopId: stopPart === 'trip' ? null : stopPart,
                actionId: 'escalate',
                outcome: `Escalated to ${target.person} (${target.label})`,
                note: input.note.trim(),
                by: CURRENT_ACTOR,
                at,
              },
            ],
          };
        }
      }
      const message = `Escalated to ${target.person} (${target.label})${about}.`;
      return withEvent(next, at, 'escalated', withNote(message, input.note));
    });
  },

  /** Mark the consignment note or the POD as received. */
  markDocumentReceived(tripId: string, document: keyof TripDocuments) {
    updateTrip(tripId, (trip, at) => {
      if (trip.documents[document] === 'uploaded') return trip;
      const next = { ...trip, documents: { ...trip.documents, [document]: 'uploaded' as const } };
      const name = document === 'pod' ? 'Proof of delivery' : 'Consignment note';
      return withEvent(next, at, 'document', `${name} marked as received.${resolvedSuffix(trip, next)}`);
    });
  },

  addNote(tripId: string, note: string) {
    if (!note.trim()) return;
    updateTrip(tripId, (trip, at) => withEvent(trip, at, 'note', note.trim()));
  },

  /** Cancel a scheduled or in-transit trip. Its vehicle and driver become free. */
  cancelTrip(tripId: string, reason: string, note?: string) {
    updateTrip(tripId, (trip, at) => {
      if (trip.status !== 'scheduled' && trip.status !== 'in_transit') return trip;
      const next = { ...trip, status: 'cancelled' as const, cancelReason: reason, tracking: null };
      return withEvent(next, at, 'cancelled', withNote(`Trip cancelled: ${reason}.`, note));
    });
  },

  /** Create or update a draft. Returns the draft id (new drafts get one). */
  saveDraft(input: { id?: string | null; step: WizardStep; form: TripForm }): string {
    const current = getSnapshot();
    const at = nextTimestamp(current);
    const existing = input.id ? current.drafts.find((d) => d.id === input.id) : undefined;
    if (existing) {
      const drafts = current.drafts.map((d) =>
        d.id === existing.id ? { ...d, step: input.step, form: input.form, updatedAt: at } : d,
      );
      commit({ ...current, drafts, lastActionAt: at });
      return existing.id;
    }
    const number = current.lastDraftNumber + 1;
    const id = `DRF-${number}`;
    const draft: TripDraft = { id, step: input.step, form: input.form, createdAt: at, updatedAt: at };
    commit({ ...current, drafts: [...current.drafts, draft], lastActionAt: at, lastDraftNumber: number });
    return id;
  },

  deleteDraft(id: string) {
    const current = getSnapshot();
    commit({ ...current, drafts: current.drafts.filter((d) => d.id !== id) });
  },

  /**
   * Validate the form and create the trip. Removes the draft it came from.
   * Returns the new trip id, or the problems to show.
   */
  submitTrip(form: TripForm, draftId?: string | null): { ok: true; tripId: string } | { ok: false; issues: FormIssue[] } {
    const current = getSnapshot();
    const issues = validateTripForm(form, current.trips);
    if (issues.length) return { ok: false, issues };
    const at = nextTimestamp(current);
    const id = `TRP-${nextNumber(current.trips.map((t) => t.id), 'TRP-', 24101)}`;
    const built = formToTrip(form, id, at);
    if (!built) return { ok: false, issues: [{ step: 1, field: 'form', message: 'Complete every step first.' }] };
    let trip = withEvent(built, at, 'created', `Trip created${built.reference ? ` for order ${built.reference}` : ''}.`);
    const vehicle = getVehicle(trip.vehicleId);
    const driver = getDriver(trip.driverId);
    if (vehicle || driver) {
      const parts = [vehicle ? `vehicle ${vehicleLabel(vehicle)}` : null, driver ? `driver ${driver.name}` : null];
      trip = withEvent(trip, at, 'assigned', `Assigned ${parts.filter(Boolean).join(' and ')}.`);
    }
    commit({
      ...current,
      trips: [...current.trips, trip],
      drafts: draftId ? current.drafts.filter((d) => d.id !== draftId) : current.drafts,
      lastActionAt: at,
    });
    return { ok: true, tripId: id };
  },

  /** Throw away every change made in this browser and go back to the seed data. */
  resetDemo() {
    commit(seedState());
  },
};
