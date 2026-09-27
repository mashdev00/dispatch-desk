/**
 * Domain types for the dispatch prototype.
 *
 * All times are ISO 8601 strings in Pakistan time, e.g. "2026-09-29T10:30:00+05:00".
 * Pakistan has no daylight saving, so the offset is always +05:00.
 */

/** Lifecycle of a real trip. Drafts are kept separately (see TripDraft). */
export type TripStatus = 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';

/** What the trips table shows in its Status column: a trip status, or a draft. */
export type RowStatus = TripStatus | 'draft';

export type Severity = 'critical' | 'warning';

/** Colour family used by badges. Each tone maps to tokens in globals.css. */
export type Tone = 'neutral' | 'info' | 'active' | 'success' | 'warning' | 'critical';

export type CargoCategory =
  | 'fmcg'
  | 'beverages'
  | 'dairy_chilled'
  | 'pharma_chilled'
  | 'frozen'
  | 'textiles'
  | 'appliances'
  | 'cement'
  | 'fertilizer'
  | 'steel';

export type VehicleType =
  | 'shehzore'
  | 'mazda_20ft'
  | 'hino_22ft'
  | 'reefer_mazda'
  | 'reefer_22ft'
  | 'ten_wheeler'
  | 'trailer_40ft';

/** Pakistani driving licence classes: light and heavy transport vehicle. */
export type LicenceClass = 'LTV' | 'HTV';

export interface City {
  id: string; // "lahore"
  name: string; // "Lahore"
  province: string; // "Punjab"
}

export interface Client {
  id: string; // "CL-03"
  name: string;
  industry: string;
  contactName: string;
  contactPhone: string;
}

export interface Vehicle {
  id: string; // "V-07"
  code: string; // fleet number shown in the UI, "TRK-107"
  plate: string; // "LES-4821"
  type: VehicleType;
  capacityKg: number;
  reefer: boolean;
  homeCityId: string;
  /** Set when the vehicle is in the workshop and can't be assigned until this time. */
  inWorkshopUntil: string | null;
}

export interface Driver {
  id: string; // "D-12"
  name: string;
  phone: string;
  licence: LicenceClass;
  homeCityId: string;
  /** Hours driven in the 24 hours before demo time. Company limit is POLICY.maxDrivingHours24h. */
  drivingHoursLast24h: number;
}

export interface Cargo {
  category: CargoCategory;
  description: string;
  weightKg: number;
  pallets: number | null;
  /** Allowed temperature band. null means the cargo doesn't need a refrigerated truck. */
  tempRangeC: { min: number; max: number } | null;
}

export type StopKind = 'pickup' | 'drop';

export interface Stop {
  id: string; // "S1", "S2"… unique inside a trip
  kind: StopKind;
  cityId: string;
  siteName: string;
  address: string;
  contactName: string;
  contactPhone: string;
  /** Agreed time window at this stop. */
  windowStart: string;
  windowEnd: string;
  /** Latest estimate from tracking. Only set on stops the truck hasn't reached yet. */
  eta: string | null;
  arrivedAt: string | null;
  departedAt: string | null;
}

export interface Tracking {
  lastPingAt: string;
  locationLabel: string; // "M-2 motorway, near Bhera"
  speedKph: number;
}

export interface TempReading {
  at: string;
  celsius: number;
}

export type DocumentStatus = 'missing' | 'uploaded';

export interface TripDocuments {
  /** The consignment note ("bilty"): the paper that travels with the load. */
  consignmentNote: DocumentStatus;
  /** Proof of delivery, signed by the consignee. */
  pod: DocumentStatus;
}

export type ActivityKind =
  | 'created'
  | 'assigned'
  | 'arrived'
  | 'departed'
  | 'eta'
  | 'alert'
  | 'document'
  | 'exception'
  | 'escalated'
  | 'rescheduled'
  | 'note'
  | 'delivered'
  | 'cancelled';

export interface ActivityEvent {
  id: string;
  at: string;
  /** "System", "Driver app" or a person, e.g. "Hina Tariq · Dispatch". */
  actor: string;
  kind: ActivityKind;
  message: string;
}

export type ExceptionRuleId =
  | 'missed_window'
  | 'late_risk'
  | 'unassigned'
  | 'reefer_mismatch'
  | 'over_capacity'
  | 'temp_excursion'
  | 'tracking_stale'
  | 'detention'
  | 'driver_hours'
  | 'missing_consignment_note'
  | 'pod_overdue';

export type ExceptionActionId =
  | 'assign'
  | 'reschedule'
  | 'notify_client'
  | 'contact_driver'
  | 'escalate'
  | 'record_action'
  | 'plan_rest'
  | 'mark_note_received'
  | 'mark_pod_received';

/** A dispatcher's recorded response to an exception. */
export interface HandledException {
  /** Same key as TripException.key, e.g. "late_risk:S3" or "tracking_stale:trip". */
  key: string;
  ruleId: ExceptionRuleId;
  stopId: string | null;
  actionId: ExceptionActionId;
  outcome: string;
  note: string;
  by: string;
  at: string;
}

export interface Trip {
  id: string; // "TRP-24107"
  /** The client's order reference, e.g. "PO-77812". Can be empty. */
  reference: string;
  status: TripStatus;
  clientId: string;
  cargo: Cargo;
  /** In route order. The first stop is the pickup. Always at least two stops. */
  stops: Stop[];
  vehicleId: string | null;
  driverId: string | null;
  /** Live position. Only set while the trip is in transit. */
  tracking: Tracking | null;
  /** Readings every 15 minutes for refrigerated loads. Empty for everything else. */
  temperatureLog: TempReading[];
  documents: TripDocuments;
  handled: HandledException[];
  /** Oldest first. */
  activity: ActivityEvent[];
  cancelReason: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** An exception produced by the rules in exceptions.ts. Never stored; always computed. */
export interface TripException {
  key: string;
  ruleId: ExceptionRuleId;
  severity: Severity;
  title: string;
  /** Evidence in one sentence, e.g. "ETA 15:35 is 35 min after the window closes (15:00)." */
  detail: string;
  stopId: string | null;
  /** Suggested next actions, most useful first. */
  actions: ExceptionActionId[];
  /** Ready-made outcomes for the "record action" dialog. */
  outcomes: string[];
  /** Set when a dispatcher has already responded to this exception. */
  handled: HandledException | null;
}

// ---------------------------------------------------------------------------
// New-trip wizard
// ---------------------------------------------------------------------------

/** One stop as the wizard edits it. Windows use the <input type="datetime-local"> format, Pakistan time. */
export interface StopForm {
  key: string; // stable React key
  kind: StopKind;
  cityId: string;
  siteName: string;
  address: string;
  contactName: string;
  contactPhone: string;
  windowStart: string; // "2026-09-30T08:00"
  windowEnd: string;
}

/** Everything the wizard collects. Numbers stay strings until the trip is created. */
export interface TripForm {
  clientId: string;
  reference: string;
  cargoCategory: CargoCategory | '';
  cargoDescription: string;
  weightKg: string;
  pallets: string;
  stops: StopForm[];
  vehicleId: string;
  driverId: string;
  /** true = create the trip without a vehicle and driver; the "unassigned" rule will flag it. */
  assignLater: boolean;
  notes: string;
}

export type WizardStep = 1 | 2 | 3 | 4;

export interface TripDraft {
  id: string; // "DRF-1001"
  /** Furthest step the user reached, so "Continue" can reopen it there. */
  step: WizardStep;
  form: TripForm;
  createdAt: string;
  updatedAt: string;
}

/** A validation problem in the wizard. `field` is a path such as "weightKg" or "stops.1.windowEnd". */
export interface FormIssue {
  step: 1 | 2 | 3;
  field: string;
  message: string;
}
