/**
 * Reference data (cities, clients, vehicles, drivers) and questions about it:
 * "who is this?", "how long is this drive?", "which trucks are free?".
 */
import citiesData from '../data/cities.json';
import clientsData from '../data/clients.json';
import driversData from '../data/drivers.json';
import vehiclesData from '../data/vehicles.json';
import { VEHICLE_TYPES } from './config';
import { formatKg } from './format';
import { formatDateTime, toMs } from './time';
import type { City, Client, Driver, Stop, Trip, Vehicle } from './types';

export const CITIES = citiesData as City[];
export const CLIENTS = clientsData as Client[];
export const VEHICLES = vehiclesData as Vehicle[];
export const DRIVERS = driversData as Driver[];

const cityById = new Map(CITIES.map((c) => [c.id, c]));
const clientById = new Map(CLIENTS.map((c) => [c.id, c]));
const vehicleById = new Map(VEHICLES.map((v) => [v.id, v]));
const driverById = new Map(DRIVERS.map((d) => [d.id, d]));

export const getCity = (id: string | null | undefined) => (id ? cityById.get(id) : undefined);
export const getClient = (id: string | null | undefined) => (id ? clientById.get(id) : undefined);
export const getVehicle = (id: string | null | undefined) => (id ? vehicleById.get(id) : undefined);
export const getDriver = (id: string | null | undefined) => (id ? driverById.get(id) : undefined);

/** City name, or "—" when unknown or not chosen yet. */
export function cityName(id: string | null | undefined): string {
  return getCity(id)?.name ?? '—';
}

/** "TRK-107 · Hino 22 ft" */
export function vehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.code} · ${VEHICLE_TYPES[vehicle.type].label}`;
}

/** "Pickup at Lahore", "Drop at Sialkot", or "Drop 2 at Sialkot" when there are several drops. */
export function stopLabel(trip: Trip, stop: Stop): string {
  const city = cityName(stop.cityId);
  if (stop.kind === 'pickup') return `Pickup at ${city}`;
  const drops = trip.stops.filter((s) => s.kind === 'drop');
  return drops.length > 1 ? `Drop ${drops.indexOf(stop) + 1} at ${city}` : `Drop at ${city}`;
}

// ---------------------------------------------------------------------------
// Drive times
// ---------------------------------------------------------------------------

/** Typical truck driving time in minutes between neighbouring cities (rounded, rest stops not included). */
const ROAD_LEGS: [string, string, number][] = [
  ['karachi', 'hyderabad', 180],
  ['hyderabad', 'sukkur', 330],
  ['sukkur', 'multan', 390],
  ['sukkur', 'quetta', 420],
  ['karachi', 'quetta', 780],
  ['multan', 'lahore', 330],
  ['multan', 'faisalabad', 240],
  ['faisalabad', 'lahore', 180],
  ['faisalabad', 'islamabad', 285],
  ['lahore', 'gujranwala', 90],
  ['gujranwala', 'sialkot', 75],
  ['lahore', 'sialkot', 135],
  ['lahore', 'islamabad', 330],
  ['lahore', 'chakwal', 240],
  ['chakwal', 'islamabad', 120],
  ['islamabad', 'rawalpindi', 45],
  ['islamabad', 'peshawar', 180],
  ['rawalpindi', 'peshawar', 180],
];

const graph = new Map<string, [string, number][]>();
for (const [a, b, minutes] of ROAD_LEGS) {
  graph.set(a, [...(graph.get(a) ?? []), [b, minutes]]);
  graph.set(b, [...(graph.get(b) ?? []), [a, minutes]]);
}

const driveCache = new Map<string, number | null>();

/** Shortest typical driving time between two cities, in minutes. 0 inside the same city. */
export function driveMinutes(fromCityId: string, toCityId: string): number | null {
  if (!fromCityId || !toCityId) return null;
  if (fromCityId === toCityId) return 0;
  const cacheKey = `${fromCityId}|${toCityId}`;
  if (driveCache.has(cacheKey)) return driveCache.get(cacheKey) ?? null;

  // Dijkstra on a tiny graph: fine to do it the simple way.
  const dist = new Map<string, number>([[fromCityId, 0]]);
  const done = new Set<string>();
  let current: string | null = fromCityId;
  while (current !== null && current !== toCityId) {
    done.add(current);
    const base = dist.get(current) ?? 0;
    for (const [next, minutes] of graph.get(current) ?? []) {
      if (base + minutes < (dist.get(next) ?? Infinity)) dist.set(next, base + minutes);
    }
    current = null;
    let best = Infinity;
    for (const [city, d] of dist) {
      if (!done.has(city) && d < best) {
        best = d;
        current = city;
      }
    }
  }
  const result = dist.get(toCityId) ?? null;
  driveCache.set(cacheKey, result);
  return result;
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export interface TimeRange {
  start: string;
  end: string;
}

/** The time a trip ties up its vehicle and driver. null for delivered and cancelled trips. */
export function busyWindow(trip: Trip): TimeRange | null {
  if (trip.status !== 'scheduled' && trip.status !== 'in_transit') return null;
  const first = trip.stops[0];
  const last = trip.stops[trip.stops.length - 1];
  const start = first.arrivedAt ?? first.windowStart;
  const end = last.eta && toMs(last.eta) > toMs(last.windowEnd) ? last.eta : last.windowEnd;
  return { start, end };
}

const overlaps = (a: TimeRange, b: TimeRange) =>
  toMs(a.start) < toMs(b.end) && toMs(b.start) < toMs(a.end);

export interface VehicleNeed {
  weightKg: number;
  needsReefer: boolean;
  window: TimeRange;
  /** Ignore this trip when checking clashes (the trip being reassigned). */
  excludeTripId?: string;
}

export interface VehicleOption {
  vehicle: Vehicle;
  /** Free for the whole window (not on another trip, not in the workshop). */
  available: boolean;
  /** Big enough, and refrigerated if the cargo needs it. */
  fits: boolean;
  /** Why it's unavailable or doesn't fit, in plain words. Empty when it's a good choice. */
  reasons: string[];
}

/** Every vehicle, best choices first: free and fitting, smallest that fits first. */
export function getVehicleOptions(trips: Trip[], need: VehicleNeed): VehicleOption[] {
  const options = VEHICLES.map((vehicle): VehicleOption => {
    const reasons: string[] = [];
    let available = true;
    let fits = true;

    if (vehicle.inWorkshopUntil && toMs(vehicle.inWorkshopUntil) > toMs(need.window.start)) {
      available = false;
      reasons.push(`In the workshop until ${formatDateTime(vehicle.inWorkshopUntil)}`);
    }
    for (const trip of trips) {
      if (trip.id === need.excludeTripId || trip.vehicleId !== vehicle.id) continue;
      const busy = busyWindow(trip);
      if (busy && overlaps(busy, need.window)) {
        available = false;
        reasons.push(`On ${trip.id} until ${formatDateTime(busy.end)}`);
      }
    }
    if (vehicle.capacityKg < need.weightKg) {
      fits = false;
      reasons.push(`Carries up to ${formatKg(vehicle.capacityKg)}`);
    }
    if (need.needsReefer && !vehicle.reefer) {
      fits = false;
      reasons.push('Not refrigerated');
    }
    return { vehicle, available, fits, reasons };
  });

  const rank = (o: VehicleOption) => (o.available && o.fits ? 0 : o.fits ? 1 : 2);
  return options.sort(
    (a, b) => rank(a) - rank(b) || a.vehicle.capacityKg - b.vehicle.capacityKg || a.vehicle.code.localeCompare(b.vehicle.code),
  );
}

export interface DriverNeed {
  window: TimeRange;
  excludeTripId?: string;
}

export interface DriverOption {
  driver: Driver;
  available: boolean;
  reasons: string[];
}

/** Every driver, free ones first, most rested first. */
export function getDriverOptions(trips: Trip[], need: DriverNeed): DriverOption[] {
  const options = DRIVERS.map((driver): DriverOption => {
    const reasons: string[] = [];
    for (const trip of trips) {
      if (trip.id === need.excludeTripId || trip.driverId !== driver.id) continue;
      const busy = busyWindow(trip);
      if (busy && overlaps(busy, need.window)) reasons.push(`On ${trip.id} until ${formatDateTime(busy.end)}`);
    }
    return { driver, available: reasons.length === 0, reasons };
  });
  return options.sort(
    (a, b) =>
      Number(b.available) - Number(a.available) ||
      a.driver.drivingHoursLast24h - b.driver.drivingHoursLast24h ||
      a.driver.name.localeCompare(b.driver.name),
  );
}
