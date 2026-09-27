'use client';

import { CARGO_CATEGORIES } from '@/lib/config';
import { formatTempRange } from '@/lib/format';
import { CLIENTS } from '@/lib/lookups';
import type { CargoCategory, FormIssue, TripForm } from '@/lib/types';
import SelectField from '@/components/ui/SelectField';
import TextField from '@/components/ui/TextField';
import TextareaField from '@/components/ui/TextareaField';
import { fieldId, issueFor } from '@/components/ui/fieldId';
import styles from './WizardForm.module.css';

export type StepProps = {
  form: TripForm;
  onChange: (form: TripForm) => void;
  issues: FormIssue[];
  showErrors: boolean;
};

const CLIENT_OPTIONS = [...CLIENTS]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ value: c.id, label: c.name }));

const CARGO_OPTIONS = (Object.keys(CARGO_CATEGORIES) as CargoCategory[]).map((key) => ({
  value: key,
  label: CARGO_CATEGORIES[key].label,
}));

export default function StepCargo({ form, onChange, issues, showErrors }: StepProps) {
  const error = (field: string) => (showErrors ? issueFor(issues, field) : undefined);
  const set = (patch: Partial<TripForm>) => onChange({ ...form, ...patch });
  const band = form.cargoCategory ? CARGO_CATEGORIES[form.cargoCategory].tempRangeC : null;

  return (
    <div className={styles.fields}>
      <SelectField
        id={fieldId('clientId')}
        label="Client"
        placeholder="Select a client"
        options={CLIENT_OPTIONS}
        value={form.clientId}
        onChange={(event) => set({ clientId: event.target.value })}
        error={error('clientId')}
      />
      <TextField
        id={fieldId('reference')}
        label="Order reference (optional)"
        hint="The client's PO or order number. Up to 30 characters."
        value={form.reference}
        maxLength={30}
        onChange={(event) => set({ reference: event.target.value })}
        error={error('reference')}
      />
      <SelectField
        id={fieldId('cargoCategory')}
        label="Cargo type"
        placeholder="Select the type of cargo"
        options={CARGO_OPTIONS}
        value={form.cargoCategory}
        hint={band ? `Needs a refrigerated truck: ${formatTempRange(band)}.` : undefined}
        onChange={(event) => set({ cargoCategory: event.target.value as CargoCategory | '' })}
        error={error('cargoCategory')}
      />
      <TextareaField
        id={fieldId('cargoDescription')}
        label="Description"
        hint="For example: UHT milk, 1 L cartons."
        rows={2}
        value={form.cargoDescription}
        onChange={(event) => set({ cargoDescription: event.target.value })}
        error={error('cargoDescription')}
      />
      <div className={styles.pair}>
        <TextField
          id={fieldId('weightKg')}
          label="Weight"
          suffix="kg"
          inputMode="numeric"
          autoComplete="off"
          value={form.weightKg}
          onChange={(event) => set({ weightKg: event.target.value })}
          error={error('weightKg')}
        />
        <TextField
          id={fieldId('pallets')}
          label="Pallets (optional)"
          inputMode="numeric"
          autoComplete="off"
          value={form.pallets}
          onChange={(event) => set({ pallets: event.target.value })}
          error={error('pallets')}
        />
      </div>
    </div>
  );
}
