'use client';

import { useState } from 'react';
import CheckboxField from '@/components/ui/CheckboxField';
import RadioGroup from '@/components/ui/RadioGroup';
import SelectField from '@/components/ui/SelectField';
import TextareaField from '@/components/ui/TextareaField';
import TextField from '@/components/ui/TextField';
import Section, { Sample } from './Section';
import styles from './DesignSystemPage.module.css';

const CITY_OPTIONS = [
  { value: 'lhe', label: 'Lahore' },
  { value: 'khi', label: 'Karachi' },
  { value: 'isb', label: 'Islamabad' },
];

const VEHICLE_OPTIONS = [
  { value: 'trk-107', label: 'TRK-107 · Hino 22 ft', description: '10,000 kg · Lahore' },
  { value: 'trk-112', label: 'TRK-112 · Reefer 22 ft', description: '8,000 kg · Refrigerated · Karachi' },
  { value: 'trk-118', label: 'TRK-118 · Mazda 20 ft', description: 'On TRP-24121 until 16:00', disabled: true },
];

export default function FormControlsSection() {
  const [vehicle, setVehicle] = useState('trk-107');
  const [escalateTo, setEscalateTo] = useState('');

  return (
    <Section
      id="form-controls"
      title="Form controls"
      description="Every field has a visible label. Hints and errors sit under the label and are linked to the input, so screen readers read them too."
    >
      <Sample label="Text field">
        <div className={styles.stack}>
          <TextField label="Site name" placeholder="Warehouse 3" />
          <TextField label="Order reference" hint="Optional. Up to 30 characters." />
          <TextField label="Weight" suffix="kg" inputMode="numeric" defaultValue="12,000" />
          <TextField label="Weight" suffix="kg" inputMode="numeric" error="Enter the weight in kilograms." />
          <TextField label="Trip ID" defaultValue="TRP-24152" disabled />
        </div>
      </Sample>
      <Sample label="Select">
        <div className={styles.stack}>
          <SelectField label="City" placeholder="Choose a city" options={CITY_OPTIONS} defaultValue="" />
          <SelectField label="City" hint="Where the truck is loaded." options={CITY_OPTIONS} defaultValue="lhe" />
          <SelectField label="City" placeholder="Choose a city" options={CITY_OPTIONS} defaultValue="" error="Choose the pickup city." />
          <SelectField label="City" options={CITY_OPTIONS} defaultValue="khi" disabled />
        </div>
      </Sample>
      <Sample label="Textarea">
        <div className={styles.stack}>
          <TextareaField label="Note" hint="Visible to everyone on the dispatch team." />
          <TextareaField label="Reason" error="Tell us why the window changed." />
        </div>
      </Sample>
      <Sample label="Checkbox">
        <div className={styles.stack}>
          <CheckboxField label="Needs attention only" />
          <CheckboxField label="Assign later" hint="The trip shows “Vehicle or driver missing” until you assign one." defaultChecked />
          <CheckboxField label="Disabled option" disabled />
        </div>
      </Sample>
      <Sample label="Radio group" wide>
        <div className={styles.stack}>
          <RadioGroup
            legend="Vehicle"
            name="ds-vehicle"
            value={vehicle}
            onChange={setVehicle}
            options={VEHICLE_OPTIONS}
            hint="Busy vehicles stay in the list, disabled, with the reason."
          />
          <RadioGroup
            legend="Escalate to"
            name="ds-escalate"
            value={escalateTo}
            onChange={setEscalateTo}
            options={[
              { value: 'fleet', label: 'Fleet manager', description: 'Samina Raza' },
              { value: 'ops', label: 'Head of operations', description: 'Kashif Mirza' },
            ]}
            error={escalateTo ? undefined : 'Choose who to escalate to.'}
          />
        </div>
      </Sample>
    </Section>
  );
}
