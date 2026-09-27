/**
 * The demo clock and all date/time formatting.
 *
 * The prototype is frozen at DEMO_NOW so the data always tells the same story.
 * Formatting is done by hand in Pakistan time (UTC+5, no daylight saving) instead of
 * toLocaleString(), so the server and the browser always produce the same text.
 * Different text on server and client would cause React hydration errors.
 */

export const DEMO_NOW_ISO = '2026-09-29T10:30:00+05:00';
export const DEMO_NOW = new Date(DEMO_NOW_ISO);
export const DEMO_NOW_MS = DEMO_NOW.getTime();

const OFFSET_MS = 5 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toMs(iso: string): number {
  return new Date(iso).getTime();
}

/** Pakistan-local calendar fields for a moment in time. */
function parts(iso: string) {
  const d = new Date(toMs(iso) + OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** Milliseconds → "2026-09-29T10:30:00+05:00". */
export function toPkIso(ms: number): string {
  const d = new Date(ms + OFFSET_MS);
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+05:00`
  );
}

export function addMinutes(iso: string, minutes: number): string {
  return toPkIso(toMs(iso) + minutes * MINUTE_MS);
}

/** Whole minutes from `from` to `to`. Negative when `to` is earlier. */
export function minutesBetween(from: string, to: string): number {
  return Math.round((toMs(to) - toMs(from)) / MINUTE_MS);
}

/** Minutes from demo time until `iso`. Positive = future, negative = past. */
export function minutesFromNow(iso: string): number {
  return Math.round((toMs(iso) - DEMO_NOW_MS) / MINUTE_MS);
}

export function isSameDay(a: string, b: string): boolean {
  const x = parts(a);
  const y = parts(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}

/** "14:30" */
export function formatTime(iso: string): string {
  const p = parts(iso);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "Tue 29 Sep" */
export function formatDay(iso: string): string {
  const p = parts(iso);
  return `${WEEKDAYS[p.weekday]} ${p.day} ${MONTHS[p.month]}`;
}

/** "29 Sep 2026" */
export function formatDate(iso: string): string {
  const p = parts(iso);
  return `${p.day} ${MONTHS[p.month]} ${p.year}`;
}

/** "Tue 29 Sep, 14:30" */
export function formatDateTime(iso: string): string {
  return `${formatDay(iso)}, ${formatTime(iso)}`;
}

/** "14:30" if it's on the demo day, otherwise "Wed 30 Sep, 14:30". Good for dense table cells. */
export function formatSmart(iso: string): string {
  return isSameDay(iso, DEMO_NOW_ISO) ? formatTime(iso) : formatDateTime(iso);
}

/** "Tue 29 Sep, 14:00–16:00", or "Tue 29 Sep 22:00 – Wed 30 Sep 02:00" across midnight. */
export function formatWindow(start: string, end: string): string {
  if (isSameDay(start, end)) return `${formatDay(start)}, ${formatTime(start)}–${formatTime(end)}`;
  return `${formatDay(start)} ${formatTime(start)} – ${formatDay(end)} ${formatTime(end)}`;
}

/** 45 → "45 min", 160 → "2 h 40 min", 2750 → "1 d 22 h" (rounded to the hour after a day). Uses the absolute value. */
export function formatDuration(minutes: number): string {
  const m = Math.abs(Math.round(minutes));
  if (m < 60) return `${m} min`;
  if (m < 1440) {
    const hours = Math.floor(m / 60);
    const mins = m - hours * 60;
    return mins ? `${hours} h ${mins} min` : `${hours} h`;
  }
  const totalHours = Math.round(m / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours - days * 24;
  return hours ? `${days} d ${hours} h` : `${days} d`;
}

/** Relative to demo time: "in 1 h 30 min", "35 min ago", "just now". */
export function formatRelative(iso: string): string {
  const diff = minutesFromNow(iso);
  if (Math.abs(diff) < 1) return 'just now';
  return diff > 0 ? `in ${formatDuration(diff)}` : `${formatDuration(diff)} ago`;
}

/** ISO → value for <input type="datetime-local">: "2026-09-29T14:30". */
export function toInputValue(iso: string): string {
  const p = parts(iso);
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Value from <input type="datetime-local"> (read as Pakistan time) → ISO. null if empty or invalid. */
export function fromInputValue(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}:00+05:00`);
  return Number.isNaN(ms) ? null : toPkIso(ms);
}
