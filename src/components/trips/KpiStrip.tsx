'use client';

import { formatPercent } from '@/lib/format';
import type { Kpis } from '@/lib/trips';
import StatCard from '@/components/ui/StatCard';
import styles from './KpiStrip.module.css';

export type KpiFilter = 'attention' | 'in_transit' | 'scheduled' | 'delivered_today';

type KpiStripProps = {
  kpis: Kpis | null;
  active: KpiFilter | null;
  onSelect: (filter: KpiFilter) => void;
};

export default function KpiStrip({ kpis, active, onSelect }: KpiStripProps) {
  const value = (n: number | undefined) => (kpis ? (n ?? 0) : '–');
  return (
    <section aria-label="Key numbers" className={styles.strip}>
      <StatCard
        label="Needs attention"
        value={value(kpis?.needsAttention)}
        detail={kpis ? `${kpis.critical} critical` : undefined}
        tone={kpis && kpis.critical > 0 ? 'critical' : 'warning'}
        pressed={active === 'attention'}
        onClick={() => onSelect('attention')}
      />
      <StatCard
        label="In transit"
        value={value(kpis?.inTransit)}
        tone="active"
        pressed={active === 'in_transit'}
        onClick={() => onSelect('in_transit')}
      />
      <StatCard
        label="Scheduled"
        value={value(kpis?.scheduled)}
        tone="info"
        pressed={active === 'scheduled'}
        onClick={() => onSelect('scheduled')}
      />
      <StatCard
        label="Delivered today"
        value={value(kpis?.deliveredToday)}
        tone="success"
        pressed={active === 'delivered_today'}
        onClick={() => onSelect('delivered_today')}
      />
      <StatCard
        label="On time"
        value={kpis?.onTimeRate != null ? formatPercent(kpis.onTimeRate) : '–'}
        detail={kpis && kpis.onTimeRate != null ? `${Math.round(kpis.onTimeRate * kpis.deliveredTotal)} of ${kpis.deliveredTotal} delivered` : undefined}
      />
    </section>
  );
}
