/** Token values mirrored from globals.css so the design system page can show them. */

export const COLOR_TOKENS = [
  { name: '--color-bg', value: '#F5F7FA', use: 'Page background' },
  { name: '--color-surface', value: '#FFFFFF', use: 'Cards, table, dialogs' },
  { name: '--color-surface-sunken', value: '#EEF1F5', use: 'Table header, subtle panels' },
  { name: '--color-surface-hover', value: '#F2F5F9', use: 'Row hover' },
  { name: '--color-border', value: '#DCE1E8', use: 'Dividers, card borders' },
  { name: '--color-border-strong', value: '#8792A2', use: 'Input borders' },
  { name: '--color-text', value: '#1A2230', use: 'Body text' },
  { name: '--color-text-muted', value: '#4A5566', use: 'Secondary text' },
  { name: '--color-text-subtle', value: '#5F6B7D', use: 'Meta text only' },
  { name: '--color-brand', value: '#1D5FD1', use: 'Links, primary buttons, focus' },
  { name: '--color-brand-hover', value: '#174EAD', use: 'Primary button hover' },
  { name: '--color-brand-subtle', value: '#E8F0FD', use: 'Selected, current' },
  { name: '--color-danger', value: '#C62828', use: 'Danger button' },
  { name: '--color-danger-hover', value: '#A61B1B', use: 'Danger button hover' },
] as const;

export const TONE_TOKENS = [
  { tone: 'neutral', bg: '#EEF1F5', fg: '#3D4757', border: '#C9D0DA', use: 'Draft, cancelled, handled' },
  { tone: 'info', bg: '#E8F0FD', fg: '#1A4FA8', border: '#B9CFF5', use: 'Scheduled' },
  { tone: 'active', bg: '#E3F5F3', fg: '#0B6259', border: '#A8DDD6', use: 'In transit' },
  { tone: 'success', bg: '#E6F4EA', fg: '#1B6B35', border: '#B3DDBF', use: 'Delivered' },
  { tone: 'warning', bg: '#FFF4DC', fg: '#8A4B00', border: '#F1CF8A', use: 'Warning' },
  { tone: 'critical', bg: '#FDECEC', fg: '#A61B1B', border: '#F3B8B8', use: 'Critical' },
] as const;

export const TYPE_TOKENS = [
  { name: '--text-3xl', px: 28, use: 'KPI numbers' },
  { name: '--text-2xl', px: 22, use: 'Page titles' },
  { name: '--text-xl', px: 18, use: 'Section headings' },
  { name: '--text-lg', px: 16, use: 'Card titles, inputs on phones' },
  { name: '--text-md', px: 14, use: 'Body default' },
  { name: '--text-sm', px: 13, use: 'Table cells, badges' },
  { name: '--text-xs', px: 12, use: 'Meta, secondary lines' },
] as const;

export const SPACE_TOKENS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => ({ name: `--space-${n}`, px: n * 4 }));

export const RADIUS_TOKENS = [
  { name: '--radius-sm', value: '4px' },
  { name: '--radius-md', value: '6px' },
  { name: '--radius-lg', value: '10px' },
  { name: '--radius-full', value: '999px' },
] as const;

export const SHADOW_TOKENS = ['--shadow-sm', '--shadow-md', '--shadow-lg'] as const;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours, e.g. "5.82:1". */
export function contrastRatio(a: string, b: string): string {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return `${((hi + 0.05) / (lo + 0.05)).toFixed(2)}:1`;
}
