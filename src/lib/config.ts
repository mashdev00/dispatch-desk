/**
 * Product configuration. Most "can you add a…" requests should only need a change here
 * (plus the matching union type in types.ts).
 */
import type { CargoCategory, LicenceClass, RowStatus, Tone, VehicleType } from './types';

export const APP_NAME = 'Dispatch Desk';

/** The signed-in user. There is no login; every action is recorded under this name. */
export const CURRENT_USER = { name: 'Hina Tariq', role: 'Dispatcher' } as const;
export const CURRENT_ACTOR = `${CURRENT_USER.name} · Dispatch`;

export const STATUSES: Record<RowStatus, { label: string; tone: Tone; description: string }> = {
  draft: {
    label: 'Draft',
    tone: 'neutral',
    description: 'Still being created. Nobody else can see it yet.',
  },
  scheduled: {
    label: 'Scheduled',
    tone: 'info',
    description: 'Confirmed and waiting for the truck to reach the pickup.',
  },
  in_transit: {
    label: 'In transit',
    tone: 'active',
    description: 'Started: at the pickup, on the road, or at a stop.',
  },
  delivered: {
    label: 'Delivered',
    tone: 'success',
    description: 'Reached the final stop.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'neutral',
    description: 'Stopped before delivery.',
  },
};

/** Order used by status filters and as a tie-breaker when sorting. */
export const STATUS_ORDER: RowStatus[] = ['in_transit', 'scheduled', 'draft', 'delivered', 'cancelled'];

export const CARGO_CATEGORIES: Record<
  CargoCategory,
  { label: string; tempRangeC: { min: number; max: number } | null }
> = {
  fmcg: { label: 'Packaged goods (FMCG)', tempRangeC: null },
  beverages: { label: 'Beverages', tempRangeC: null },
  dairy_chilled: { label: 'Dairy, chilled', tempRangeC: { min: 2, max: 6 } },
  pharma_chilled: { label: 'Pharma, 2–8 °C', tempRangeC: { min: 2, max: 8 } },
  frozen: { label: 'Frozen food', tempRangeC: { min: -22, max: -15 } },
  textiles: { label: 'Textiles', tempRangeC: null },
  appliances: { label: 'Home appliances', tempRangeC: null },
  cement: { label: 'Cement', tempRangeC: null },
  fertilizer: { label: 'Fertilizer', tempRangeC: null },
  steel: { label: 'Steel', tempRangeC: null },
};

export const VEHICLE_TYPES: Record<
  VehicleType,
  { label: string; licence: LicenceClass; defaultCapacityKg: number; reefer: boolean }
> = {
  shehzore: { label: 'Shehzore (light truck)', licence: 'LTV', defaultCapacityKg: 2000, reefer: false },
  mazda_20ft: { label: 'Mazda 20 ft', licence: 'HTV', defaultCapacityKg: 5000, reefer: false },
  hino_22ft: { label: 'Hino 22 ft', licence: 'HTV', defaultCapacityKg: 10000, reefer: false },
  reefer_mazda: { label: 'Reefer Mazda 16 ft', licence: 'LTV', defaultCapacityKg: 3500, reefer: true },
  reefer_22ft: { label: 'Reefer 22 ft', licence: 'HTV', defaultCapacityKg: 8000, reefer: true },
  ten_wheeler: { label: '10-wheeler', licence: 'HTV', defaultCapacityKg: 18000, reefer: false },
  trailer_40ft: { label: '40 ft trailer', licence: 'HTV', defaultCapacityKg: 27000, reefer: false },
};

/** Company policy thresholds used by the exception rules and the wizard. */
export const POLICY = {
  /** A scheduled trip with no vehicle or driver is a warning this many hours before pickup… */
  unassignedWarnHours: 12,
  /** …and critical this many hours before pickup. */
  unassignedCriticalHours: 3,
  /** Wrong vehicle (too small, not refrigerated) becomes critical this close to pickup. */
  vehicleProblemCriticalHours: 24,
  /** Predicted lateness above this is critical; below it, a warning. */
  lateCriticalMinutes: 60,
  trackingWarnMinutes: 45,
  trackingCriticalMinutes: 120,
  /** Free waiting time at a stop before detention starts. */
  detentionFreeMinutes: 120,
  detentionCriticalMinutes: 240,
  maxDrivingHours24h: 10,
  drivingHoursWarn: 9,
  /** A temperature excursion is critical after this long, or this far outside the band. */
  tempCriticalMinutes: 30,
  tempCriticalDeltaC: 2,
  podOverdueHours: 24,
  maxStops: 6,
  maxWeightKg: 30000,
} as const;

export const ESCALATION_TARGETS = [
  { id: 'fleet_manager', label: 'Fleet manager', person: 'Samina Raza' },
  { id: 'ops_head', label: 'Head of operations', person: 'Kashif Mirza' },
  { id: 'account_manager', label: 'Client account manager', person: 'Saad Qureshi' },
] as const;

export type EscalationTargetId = (typeof ESCALATION_TARGETS)[number]['id'];

export const CANCEL_REASONS = [
  'Client cancelled the order',
  'Client postponed the order',
  'Vehicle broke down before departure',
  'Duplicate order',
  'Consignee site closed',
  'Other',
] as const;
