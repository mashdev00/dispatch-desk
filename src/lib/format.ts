/**
 * Number and text formatting. Written by hand (not toLocaleString) so server and
 * browser output always match. Dates and times live in time.ts.
 */

/** 12000 → "12,000"; formatNumber(9.44, 1) → "9.4" */
export function formatNumber(n: number, decimals = 0): string {
  const [int, frac] = Math.abs(n).toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-' : '') + grouped + (frac ? `.${frac}` : '');
}

/** 12000 → "12,000 kg" */
export function formatKg(kg: number): string {
  return `${formatNumber(kg)} kg`;
}

/** 9.4 → "9.4 °C" */
export function formatTemp(celsius: number): string {
  return `${formatNumber(celsius, 1)} °C`;
}

/** { min: 2, max: 8 } → "2 to 8 °C" */
export function formatTempRange(range: { min: number; max: number }): string {
  return `${formatNumber(range.min)} to ${formatNumber(range.max)} °C`;
}

/** 0.834 → "83%" */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** plural(1, 'stop') → "1 stop", plural(3, 'stop') → "3 stops" */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

/** "Hina Tariq" → "HT" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
