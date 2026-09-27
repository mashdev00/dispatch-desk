import { STATUSES } from '@/lib/config';
import type { RowStatus } from '@/lib/types';
import Badge from './Badge';
import { TONE_ICONS } from './toneIcons';

export default function StatusBadge({ status, className }: { status: RowStatus; className?: string }) {
  const { label, tone } = STATUSES[status];
  const Icon = TONE_ICONS[tone];
  return (
    <Badge tone={tone} icon={<Icon />} className={className}>
      {label}
    </Badge>
  );
}
