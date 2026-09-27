'use client';

import { useState } from 'react';
import { SearchX } from 'lucide-react';
import { STATUSES } from '@/lib/config';
import type { RowStatus } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import InlineAlert from '@/components/ui/InlineAlert';
import SeverityBadge from '@/components/ui/SeverityBadge';
import Skeleton from '@/components/ui/Skeleton';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Section, { Sample } from './Section';
import styles from './DesignSystemPage.module.css';

export function BadgesSection() {
  return (
    <Section id="badges" title="Badges" description="Every badge has an icon and a word, so it still reads in greyscale or for colour-blind users.">
      <Sample label="Trip status">
        <div className={styles.row}>
          {(Object.keys(STATUSES) as RowStatus[]).map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Sample>
      <Sample label="Severity">
        <div className={styles.row}>
          <SeverityBadge severity="critical" />
          <SeverityBadge severity="warning" />
          <SeverityBadge severity="critical" handled />
        </div>
      </Sample>
      <Sample label="Plain badge">
        <div className={styles.row}>
          <Badge tone="info">Reefer</Badge>
          <Badge tone="neutral">HTV</Badge>
        </div>
      </Sample>
    </Section>
  );
}

export function AlertsSection() {
  return (
    <Section id="alerts" title="Alerts" description="Critical alerts interrupt screen readers (role=alert). The rest are announced politely (role=status).">
      <Sample label="Tones" wide>
        <div className={styles.stack}>
          <InlineAlert tone="info">The demo clock is frozen at Tue 29 Sep, 10:30.</InlineAlert>
          <InlineAlert tone="success">Nothing needs your attention on this trip.</InlineAlert>
          <InlineAlert tone="warning" title="Check the plan">
            <ul>
              <li>Drop 1 opens 40 min before the truck can get there from the pickup.</li>
            </ul>
          </InlineAlert>
          <InlineAlert tone="critical" title="Temperature out of range">
            9.4 °C for 45 min. Allowed: 2 to 8 °C.
          </InlineAlert>
        </div>
      </Sample>
    </Section>
  );
}

export function CardsSection() {
  return (
    <Section id="cards" title="Cards and empty state">
      <Sample label="Card">
        <Card title="Cargo" description="What the truck is carrying" actions={<Button size="sm">Edit</Button>}>
          <p>Pharma, 2–8 °C · 3,200 kg · 8 pallets</p>
        </Card>
      </Sample>
      <Sample label="Card without a header">
        <Card>
          <p>Cards group related details. The header row is optional.</p>
        </Card>
      </Sample>
      <Sample label="Empty state" wide>
        <Card>
          <EmptyState
            icon={<SearchX />}
            title="No trips match these filters"
            description="Try a different search, or clear the filters to see every trip."
            action={<Button>Reset filters</Button>}
          />
        </Card>
      </Sample>
    </Section>
  );
}

export function LoadingSection() {
  return (
    <Section id="skeleton" title="Skeleton" description="Shown until saved data has loaded, so the page never flashes wrong content. The shimmer stops when reduced motion is on.">
      <Sample label="Table rows" wide>
        <div className={styles.stack} style={{ gap: 'var(--space-3)' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.row} style={{ flexWrap: 'nowrap' }}>
              <Skeleton width="15%" height={16} />
              <Skeleton width="10%" height={16} />
              <Skeleton width="30%" height={16} />
              <Skeleton width="45%" height={16} />
            </div>
          ))}
        </div>
      </Sample>
    </Section>
  );
}

export function StatCardsSection() {
  const [pressed, setPressed] = useState<string | null>('attention');
  const toggle = (key: string) => setPressed((current) => (current === key ? null : key));

  return (
    <Section id="stat-cards" title="Stat cards" description="KPIs. When a card filters the table, it becomes a toggle button with aria-pressed.">
      <Sample label="Clickable (filters)" wide>
        <div className={styles.statGrid}>
          <StatCard label="Needs attention" value={14} detail="5 critical" tone="critical" pressed={pressed === 'attention'} onClick={() => toggle('attention')} />
          <StatCard label="In transit" value={19} tone="active" pressed={pressed === 'transit'} onClick={() => toggle('transit')} />
          <StatCard label="Scheduled" value={16} tone="info" pressed={pressed === 'scheduled'} onClick={() => toggle('scheduled')} />
        </div>
      </Sample>
      <Sample label="Display only">
        <StatCard label="On-time rate" value="82%" detail="9 of 11 delivered" tone="success" />
      </Sample>
    </Section>
  );
}
