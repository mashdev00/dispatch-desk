'use client';

import { useId } from 'react';
import { Search } from 'lucide-react';
import { STATUSES, STATUS_ORDER } from '@/lib/config';
import { CLIENTS } from '@/lib/lookups';
import type { RowStatus } from '@/lib/types';
import Button from '@/components/ui/Button';
import CheckboxField from '@/components/ui/CheckboxField';
import SelectField from '@/components/ui/SelectField';
import { cx } from '@/components/ui/cx';
import fieldStyles from '@/components/ui/Field.module.css';
import styles from './TripsFilters.module.css';

type TripsFiltersProps = {
  query: string;
  onQueryChange: (query: string) => void;
  statuses: Set<RowStatus>;
  onToggleStatus: (status: RowStatus) => void;
  statusCounts: Record<RowStatus, number>;
  clientId: string;
  onClientChange: (clientId: string) => void;
  attentionOnly: boolean;
  onAttentionOnlyChange: (value: boolean) => void;
  /** Extra filters set elsewhere (the KPI strip) that Reset also clears. */
  otherActive: boolean;
  onReset: () => void;
  /** null while saved data is loading. */
  shown: number | null;
  total: number | null;
};

const CLIENT_OPTIONS = [...CLIENTS]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((client) => ({ value: client.id, label: client.name }));

export default function TripsFilters({
  query,
  onQueryChange,
  statuses,
  onToggleStatus,
  statusCounts,
  clientId,
  onClientChange,
  attentionOnly,
  onAttentionOnlyChange,
  otherActive,
  onReset,
  shown,
  total,
}: TripsFiltersProps) {
  const searchId = useId();
  const active = query.trim() !== '' || statuses.size > 0 || clientId !== '' || attentionOnly || otherActive;

  return (
    <div className={styles.filters}>
      <div className={styles.topRow}>
        <div className={cx(fieldStyles.field, styles.search)}>
          <label htmlFor={searchId} className={fieldStyles.label}>
            Search trips
          </label>
          <div className={fieldStyles.control}>
            <Search size={16} aria-hidden="true" className={styles.searchIcon} />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="ID, client, city, truck or driver"
              className={cx(fieldStyles.input, styles.searchInput)}
            />
          </div>
        </div>
        <SelectField
          label="Client"
          placeholder="All clients"
          options={CLIENT_OPTIONS}
          value={clientId}
          onChange={(event) => onClientChange(event.target.value)}
          className={styles.client}
        />
        <CheckboxField
          label="Needs attention only"
          checked={attentionOnly}
          onChange={(event) => onAttentionOnlyChange(event.target.checked)}
          className={styles.attention}
        />
      </div>
      <div className={styles.bottomRow}>
        <div role="group" aria-label="Status" className={styles.chips}>
          {STATUS_ORDER.map((status) => {
            const pressed = statuses.has(status);
            return (
              <button
                key={status}
                type="button"
                aria-pressed={pressed}
                onClick={() => onToggleStatus(status)}
                className={cx(styles.chip, pressed && styles.chipPressed)}
              >
                {STATUSES[status].label}
                <span className={styles.chipCount}>{statusCounts[status]}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.resultRow}>
          <p role="status" aria-live="polite" className={styles.count}>
            {shown === null ? 'Loading trips' : `Showing ${shown} of ${total} trips`}
          </p>
          {active && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
