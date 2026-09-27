/**
 * New-trip wizard: empty form, stop list helpers, validation, plan warnings,
 * and turning a finished form into a Trip.
 *
 * Validation messages follow one pattern: say what to do, not what went wrong
 * ("Enter the weight in kilograms", not "Invalid weight").
 */
import { CARGO_CATEGORIES, POLICY } from './config';
import { formatKg, formatNumber } from './format';
import { cityName, driveMinutes, getDriver, getDriverOptions, getVehicle, getVehicleOptions } from './lookups';
import type { TimeRange } from './lookups';
import { DEMO_NOW_ISO, formatDateTime, formatDuration, fromInputValue, minutesBetween, toMs } from './time';
import type { FormIssue, Stop, StopForm, StopKind, Trip, TripForm, WizardStep } from './types';

export const WIZARD_STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: 'Client and cargo' },
  { step: 2, label: 'Route and stops' },
  { step: 3, label: 'Vehicle and driver' },
  { step: 4, label: 'Review' },
];

function newStop(kind: StopKind, n: number): StopForm {
  return {
    key: `stop-${n}`,
    kind,
    cityId: '',
    siteName: '',
    address: '',
    contactName: '',
    contactPhone: '',
    windowStart: '',
    windowEnd: '',
  };
}

export function createEmptyForm(): TripForm {
  return {
    clientId: '',
    reference: '',
    cargoCategory: '',
    cargoDescription: '',
    weightKg: '',
    pallets: '',
    stops: [newStop('pickup', 1), newStop('drop', 2)],
    vehicleId: '',
    driverId: '',
    assignLater: false,
    notes: '',
  };
}

/** Adds an empty drop at the end. Keys are deterministic so server and client render the same. */
export function addDrop(form: TripForm): TripForm {
  if (form.stops.length >= POLICY.maxStops) return form;
  const next = Math.max(...form.stops.map((s) => Number(s.key.replace('stop-', '')) || 0)) + 1;
  return { ...form, stops: [...form.stops, newStop('drop', next)] };
}

/** Removes a drop. The pickup and the last remaining drop can't be removed. */
export function removeStop(form: TripForm, key: string): TripForm {
  const index = form.stops.findIndex((s) => s.key === key);
  if (index <= 0 || form.stops.length <= 2) return form;
  return { ...form, stops: form.stops.filter((s) => s.key !== key) };
}

/** Moves a drop up (-1) or down (+1). The pickup always stays first. */
export function moveStop(form: TripForm, key: string, direction: -1 | 1): TripForm {
  const index = form.stops.findIndex((s) => s.key === key);
  const target = index + direction;
  if (index <= 0 || target <= 0 || target >= form.stops.length) return form;
  const stops = [...form.stops];
  [stops[index], stops[target]] = [stops[target], stops[index]];
  return { ...form, stops };
}

export function updateStop(form: TripForm, key: string, patch: Partial<StopForm>): TripForm {
  return { ...form, stops: form.stops.map((s) => (s.key === key ? { ...s, ...patch } : s)) };
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/** "8,500" → 8500. null when it isn't a whole number. */
export function parseWeight(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, '');
  return /^\d+$/.test(cleaned) ? Number(cleaned) : null;
}

const PHONE = /^0\d{3}-?\d{7}$/;

const stopName = (index: number) => (index === 0 ? 'Pickup' : `Drop ${index}`);

/** The time range the whole trip covers, once every stop has valid windows. */
export function formWindow(form: TripForm): TimeRange | null {
  const first = fromInputValue(form.stops[0]?.windowStart ?? '');
  const last = fromInputValue(form.stops[form.stops.length - 1]?.windowEnd ?? '');
  return first && last ? { start: first, end: last } : null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateCargo(form: TripForm): FormIssue[] {
  const issues: FormIssue[] = [];
  const add = (field: string, message: string) => issues.push({ step: 1, field, message });

  if (!form.clientId) add('clientId', 'Select a client.');
  if (form.reference.trim().length > 30) add('reference', 'Keep the order reference to 30 characters or fewer.');
  if (!form.cargoCategory) add('cargoCategory', 'Select the type of cargo.');
  if (!form.cargoDescription.trim()) add('cargoDescription', 'Describe the cargo, for example “UHT milk, 1 L cartons”.');
  else if (form.cargoDescription.trim().length > 120) add('cargoDescription', 'Keep the description under 120 characters.');

  const weight = parseWeight(form.weightKg);
  if (!form.weightKg.trim()) add('weightKg', 'Enter the weight in kilograms.');
  else if (weight === null) add('weightKg', 'Enter the weight as a whole number, like 8500.');
  else if (weight < 1 || weight > POLICY.maxWeightKg)
    add('weightKg', `Weight must be between 1 and ${formatNumber(POLICY.maxWeightKg)} kg.`);

  if (form.pallets.trim()) {
    const pallets = Number(form.pallets);
    if (!Number.isInteger(pallets) || pallets < 0 || pallets > 40)
      add('pallets', 'Pallets must be a whole number from 0 to 40.');
  }
  return issues;
}

function validateRoute(form: TripForm): FormIssue[] {
  const issues: FormIssue[] = [];
  const add = (field: string, message: string) => issues.push({ step: 2, field, message });

  if (form.stops.length < 2) add('stops', 'Add at least one drop.');
  if (form.stops.length > POLICY.maxStops) add('stops', `A trip can have at most ${POLICY.maxStops} stops.`);

  let previousStart: string | null = null;
  form.stops.forEach((stop, i) => {
    const name = stopName(i);
    const path = `stops.${i}`;
    if (!stop.cityId) add(`${path}.cityId`, `${name}: select a city.`);
    if (!stop.siteName.trim()) add(`${path}.siteName`, `${name}: enter the site name.`);
    if (stop.contactPhone.trim() && !PHONE.test(stop.contactPhone.trim()))
      add(`${path}.contactPhone`, `${name}: enter the phone number like 0300-1234567.`);

    const start = fromInputValue(stop.windowStart);
    const end = fromInputValue(stop.windowEnd);
    if (!start) add(`${path}.windowStart`, `${name}: enter when the window opens.`);
    if (!end) add(`${path}.windowEnd`, `${name}: enter when the window closes.`);
    if (start && end) {
      const length = minutesBetween(start, end);
      if (length <= 0) add(`${path}.windowEnd`, `${name}: the window must close after it opens.`);
      else if (length > 24 * 60) add(`${path}.windowEnd`, `${name}: keep the window under 24 hours.`);
      if (i === 0 && toMs(end) <= toMs(DEMO_NOW_ISO))
        add(`${path}.windowEnd`, `Pickup: that window has already closed. Choose a time after ${formatDateTime(DEMO_NOW_ISO)}.`);
    }
    if (start && previousStart && toMs(start) < toMs(previousStart))
      add(`${path}.windowStart`, `${name}: the window can’t open before the previous stop’s window.`);
    if (start) previousStart = start;
  });
  return issues;
}

function validateAssignment(form: TripForm, trips: Trip[]): FormIssue[] {
  if (form.assignLater) return [];
  const issues: FormIssue[] = [];
  const add = (field: string, message: string) => issues.push({ step: 3, field, message });

  if (!form.vehicleId) add('vehicleId', 'Select a vehicle, or choose “Assign later”.');
  if (!form.driverId) add('driverId', 'Select a driver, or choose “Assign later”.');

  const window = formWindow(form);
  const weight = parseWeight(form.weightKg);
  if (!window || weight === null || !form.cargoCategory) return issues; // earlier steps will report these

  const vehicle = getVehicle(form.vehicleId);
  if (vehicle) {
    const needsReefer = CARGO_CATEGORIES[form.cargoCategory].tempRangeC !== null;
    const option = getVehicleOptions(trips, { weightKg: weight, needsReefer, window }).find(
      (o) => o.vehicle.id === vehicle.id,
    );
    if (option && (!option.fits || !option.available))
      add('vehicleId', `${vehicle.code} can’t take this trip. ${option.reasons.join('. ')}.`);
  }
  const driver = getDriver(form.driverId);
  if (driver) {
    const option = getDriverOptions(trips, { window }).find((o) => o.driver.id === driver.id);
    if (option && !option.available) add('driverId', `${driver.name} isn’t free. ${option.reasons.join('. ')}.`);
  }
  return issues;
}

/** Problems on one step. Step 4 (review) has no fields of its own. */
export function validateStep(form: TripForm, step: WizardStep, trips: Trip[]): FormIssue[] {
  if (step === 1) return validateCargo(form);
  if (step === 2) return validateRoute(form);
  if (step === 3) return validateAssignment(form, trips);
  return [];
}

/** Every problem on every step. The trip can be created when this is empty. */
export function validateTripForm(form: TripForm, trips: Trip[]): FormIssue[] {
  return [...validateCargo(form), ...validateRoute(form), ...validateAssignment(form, trips)];
}

/**
 * Non-blocking advice for the route step, e.g. a window that is too tight for the drive.
 * Show these as warnings; they don't stop the user.
 */
export function getPlanWarnings(form: TripForm): string[] {
  const warnings: string[] = [];
  for (let i = 1; i < form.stops.length; i++) {
    const from = form.stops[i - 1];
    const to = form.stops[i];
    const drive = driveMinutes(from.cityId, to.cityId);
    const earliestLeave = fromInputValue(from.windowStart);
    const latestArrive = fromInputValue(to.windowEnd);
    if (drive === null || !earliestLeave || !latestArrive) continue;
    const available = minutesBetween(earliestLeave, latestArrive);
    if (drive > 0 && available < drive) {
      warnings.push(
        `${cityName(from.cityId)} → ${cityName(to.cityId)} usually takes about ${formatDuration(drive)} of driving, but this plan allows ${available > 0 ? formatDuration(available) : 'no time'}.`,
      );
    }
    if (drive > POLICY.maxDrivingHours24h * 60) {
      warnings.push(
        `${cityName(from.cityId)} → ${cityName(to.cityId)} is more than ${POLICY.maxDrivingHours24h} h of driving. Plan a rest stop or a second driver.`,
      );
    }
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Form → Trip
// ---------------------------------------------------------------------------

/**
 * Builds a Trip from a valid form. Call validateTripForm first.
 * Returns null if the form isn't complete enough to build a trip.
 */
export function formToTrip(form: TripForm, id: string, now: string): Trip | null {
  const weight = parseWeight(form.weightKg);
  if (!form.cargoCategory || weight === null) return null;
  const stops: Stop[] = [];
  for (const [i, s] of form.stops.entries()) {
    const windowStart = fromInputValue(s.windowStart);
    const windowEnd = fromInputValue(s.windowEnd);
    if (!windowStart || !windowEnd) return null;
    stops.push({
      id: `S${i + 1}`,
      kind: i === 0 ? 'pickup' : 'drop',
      cityId: s.cityId,
      siteName: s.siteName.trim(),
      address: s.address.trim(),
      contactName: s.contactName.trim(),
      contactPhone: s.contactPhone.trim(),
      windowStart,
      windowEnd,
      eta: null,
      arrivedAt: null,
      departedAt: null,
    });
  }
  return {
    id,
    reference: form.reference.trim(),
    status: 'scheduled',
    clientId: form.clientId,
    cargo: {
      category: form.cargoCategory,
      description: form.cargoDescription.trim(),
      weightKg: weight,
      pallets: form.pallets.trim() ? Number(form.pallets) : null,
      tempRangeC: CARGO_CATEGORIES[form.cargoCategory].tempRangeC,
    },
    stops,
    vehicleId: form.assignLater ? null : form.vehicleId || null,
    driverId: form.assignLater ? null : form.driverId || null,
    tracking: null,
    temperatureLog: [],
    documents: { consignmentNote: 'missing', pod: 'missing' },
    handled: [],
    activity: [],
    cancelReason: null,
    notes: form.notes.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * The trip this form would create, for the review step's "what will need attention" check:
 * pass it to getTripExceptions(). null until steps 1 and 2 are complete.
 */
export function previewTrip(form: TripForm): Trip | null {
  return formToTrip(form, 'Preview', DEMO_NOW_ISO);
}

/** "8,500 kg" for the review step, or "—" when the weight isn't valid yet. */
export function formWeightLabel(form: TripForm): string {
  const weight = parseWeight(form.weightKg);
  return weight === null ? '—' : formatKg(weight);
}
