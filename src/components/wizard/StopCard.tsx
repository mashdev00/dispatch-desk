'use client';

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { CITIES, cityName } from '@/lib/lookups';
import { DEMO_NOW_ISO, toInputValue } from '@/lib/time';
import type { SiteOption } from '@/lib/trips';
import type { FormIssue, StopForm } from '@/lib/types';
import Button from '@/components/ui/Button';
import SelectField from '@/components/ui/SelectField';
import TextField from '@/components/ui/TextField';
import { fieldId, issueFor } from '@/components/ui/fieldId';
import styles from './StepRoute.module.css';

const CITY_OPTIONS = [...CITIES].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.id, label: c.name }));

type StopCardProps = {
  stop: StopForm;
  index: number;
  name: string;
  isLast: boolean;
  sites: SiteOption[];
  issues: FormIssue[];
  showErrors: boolean;
  onChange: (patch: Partial<StopForm>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export default function StopCard({ stop, index, name, isLast, sites, issues, showErrors, onChange, onMove, onRemove, canRemove }: StopCardProps) {
  const path = (field: string) => `stops.${index}.${field}`;
  const error = (field: string) => (showErrors ? issueFor(issues, path(field)) : undefined);
  const isPickup = index === 0;
  const min = toInputValue(DEMO_NOW_ISO);

  function applySite(siteName: string) {
    const site = sites.find((s) => s.siteName === siteName);
    if (site) onChange({ cityId: site.cityId, siteName: site.siteName, address: site.address, contactName: site.contactName, contactPhone: site.contactPhone });
  }

  return (
    <li className={styles.card} aria-labelledby={`${stop.key}-title`}>
      <div className={styles.cardHeader}>
        <h3 id={`${stop.key}-title`} className={styles.cardTitle}>
          {name}
          {stop.cityId && <span className={styles.city}> · {cityName(stop.cityId)}</span>}
        </h3>
        {!isPickup && (
          <div className={styles.cardActions}>
            <Button size="sm" variant="ghost" icon={<ArrowUp />} onClick={() => onMove(-1)} disabled={index === 1} aria-label={`Move ${name.toLowerCase()} up`} />
            <Button size="sm" variant="ghost" icon={<ArrowDown />} onClick={() => onMove(1)} disabled={isLast} aria-label={`Move ${name.toLowerCase()} down`} />
            <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={onRemove} disabled={!canRemove} aria-label={`Remove ${name.toLowerCase()}`} />
          </div>
        )}
      </div>
      <div className={styles.grid}>
        {sites.length > 0 && (
          <SelectField
            label="Use a saved site"
            hint="Fills in the city, site, address and contact."
            placeholder="Choose a site"
            options={sites.map((s) => ({ value: s.siteName, label: `${s.siteName} (${cityName(s.cityId)})` }))}
            value=""
            onChange={(event) => applySite(event.target.value)}
            className={styles.full}
          />
        )}
        <SelectField id={fieldId(path('cityId'))} label="City" placeholder="Select a city" options={CITY_OPTIONS} value={stop.cityId} onChange={(event) => onChange({ cityId: event.target.value })} error={error('cityId')} />
        <TextField id={fieldId(path('siteName'))} label="Site name" value={stop.siteName} onChange={(event) => onChange({ siteName: event.target.value })} error={error('siteName')} />
        <TextField id={fieldId(path('address'))} label="Address (optional)" value={stop.address} onChange={(event) => onChange({ address: event.target.value })} className={styles.full} />
        <TextField id={fieldId(path('contactName'))} label="Contact name (optional)" value={stop.contactName} onChange={(event) => onChange({ contactName: event.target.value })} />
        <TextField
          id={fieldId(path('contactPhone'))}
          label="Contact phone (optional)"
          type="tel"
          hint="Like 0300-1234567."
          value={stop.contactPhone}
          onChange={(event) => onChange({ contactPhone: event.target.value })}
          error={error('contactPhone')}
        />
        <TextField id={fieldId(path('windowStart'))} type="datetime-local" label="Window opens" hint="Pakistan time." min={min} value={stop.windowStart} onChange={(event) => onChange({ windowStart: event.target.value })} error={error('windowStart')} />
        <TextField id={fieldId(path('windowEnd'))} type="datetime-local" label="Window closes" hint="Pakistan time." min={min} value={stop.windowEnd} onChange={(event) => onChange({ windowEnd: event.target.value })} error={error('windowEnd')} />
      </div>
    </li>
  );
}
