'use client';

import { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { POLICY } from '@/lib/config';
import { useTrips } from '@/lib/store';
import { getClientSites } from '@/lib/trips';
import { addDrop, getPlanWarnings, moveStop, removeStop, updateStop } from '@/lib/wizard';
import Button from '@/components/ui/Button';
import InlineAlert from '@/components/ui/InlineAlert';
import { fieldId } from '@/components/ui/fieldId';
import StopCard from './StopCard';
import type { StepProps } from './StepCargo';
import styles from './StepRoute.module.css';

export default function StepRoute({ form, onChange, issues, showErrors }: StepProps) {
  const trips = useTrips();
  const sites = form.clientId ? getClientSites(trips, form.clientId) : [];
  const warnings = getPlanWarnings(form);
  const focusIndex = useRef<number | null>(null);

  // After adding a drop, move focus to its city field.
  useEffect(() => {
    if (focusIndex.current === null) return;
    document.getElementById(fieldId(`stops.${focusIndex.current}.cityId`))?.focus();
    focusIndex.current = null;
  }, [form.stops.length]);

  function add() {
    focusIndex.current = form.stops.length;
    onChange(addDrop(form));
  }

  const drops = form.stops.length - 1;

  return (
    <div className={styles.route}>
      <ol className={styles.list}>
        {form.stops.map((stop, index) => (
          <StopCard
            key={stop.key}
            stop={stop}
            index={index}
            name={index === 0 ? 'Pickup' : drops > 1 ? `Drop ${index}` : 'Drop'}
            isLast={index === form.stops.length - 1}
            sites={sites}
            issues={issues}
            showErrors={showErrors}
            onChange={(patch) => onChange(updateStop(form, stop.key, patch))}
            onMove={(direction) => onChange(moveStop(form, stop.key, direction))}
            onRemove={() => onChange(removeStop(form, stop.key))}
            canRemove={form.stops.length > 2}
          />
        ))}
      </ol>
      <div className={styles.addRow}>
        <Button icon={<Plus />} onClick={add} disabled={form.stops.length >= POLICY.maxStops}>
          Add a drop
        </Button>
        <span className={styles.limit}>
          {form.stops.length} of {POLICY.maxStops} stops
        </span>
      </div>
      {warnings.length > 0 && (
        <InlineAlert tone="warning" title="Check the plan">
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </InlineAlert>
      )}
    </div>
  );
}
