import { Check } from 'lucide-react';
import { SEVERITIES } from '@/lib/exceptions';
import type { Severity } from '@/lib/types';
import Badge from './Badge';
import { TONE_ICONS } from './toneIcons';

type SeverityBadgeProps = { severity: Severity; handled?: boolean; className?: string };

export default function SeverityBadge({ severity, handled = false, className }: SeverityBadgeProps) {
  if (handled) {
    return (
      <Badge tone="neutral" icon={<Check />} className={className}>
        Handled
      </Badge>
    );
  }
  const Icon = TONE_ICONS[severity];
  return (
    <Badge tone={severity} icon={<Icon />} className={className}>
      {SEVERITIES[severity].label}
    </Badge>
  );
}
