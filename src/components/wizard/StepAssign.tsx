'use client';

import { useMemo } from 'react';
import { CARGO_CATEGORIES, POLICY, VEHICLE_TYPES } from '@/lib/config';
import { formatKg } from '@/lib/format';
import { cityName, getDriverOptions, getVehicleOptions } from '@/lib/lookups';
import { useTrips } from '@/lib/store';
import { minutesFromNow } from '@/lib/time';
import type { WizardStep } from '@/lib/types';
import { formWindow, parseWeight } from '@/lib/wizard';
import UnavailableOptions from '@/components/assign/UnavailableOptions';
import Button from '@/components/ui/Button';
import CheckboxField from '@/components/ui/CheckboxField';
import InlineAlert from '@/components/ui/InlineAlert';
import RadioGroup from '@/components/ui/RadioGroup';
import { fieldId, issueFor } from '@/components/ui/fieldId';
import type { StepProps } from './StepCargo';
import styles from './WizardForm.module.css';

type StepAssignProps = StepProps & { onGoToStep: (step: WizardStep) => void };

export default function StepAssign({ form, onChange, issues, showErrors, onGoToStep }: StepAssignProps) {
  const trips = useTrips();
  const error = (field: string) => (showErrors ? issueFor(issues, field) : undefined);

  const options = useMemo(() => {
    const tripWindow = formWindow(form);
    const weightKg = parseWeight(form.weightKg);
    if (!tripWindow || weightKg === null || !form.cargoCategory) return null;
    const needsReefer = CARGO_CATEGORIES[form.cargoCategory].tempRangeC !== null;
    return {
      tripWindow,
      weightKg,
      needsReefer,
      vehicles: getVehicleOptions(trips, { weightKg, needsReefer, window: tripWindow }),
      drivers: getDriverOptions(trips, { window: tripWindow }),
    };
  }, [trips, form]);

  if (!options) {
    const cargoMissing = parseWeight(form.weightKg) === null || !form.cargoCategory;
    return (
      <div className={styles.fields}>
        <InlineAlert tone="info" title="Finish the earlier steps first">
          Vehicles and drivers depend on the cargo weight and the stop windows.
        </InlineAlert>
        <div className={styles.inlineButtons}>
          {cargoMissing && <Button onClick={() => onGoToStep(1)}>Go to Client and cargo</Button>}
          <Button onClick={() => onGoToStep(2)}>Go to Route and stops</Button>
        </div>
      </div>
    );
  }

  const goodVehicles = options.vehicles.filter((o) => o.available && o.fits);
  const badVehicles = options.vehicles.filter((o) => !(o.available && o.fits));
  const goodDrivers = options.drivers.filter((o) => o.available);
  const badDrivers = options.drivers.filter((o) => !o.available);
  const pickupSoon = minutesFromNow(options.tripWindow.start) <= POLICY.unassignedWarnHours * 60;

  return (
    <div className={styles.fields}>
      <CheckboxField
        label="Assign later"
        hint="Create the trip now and choose the vehicle and driver afterwards."
        checked={form.assignLater}
        onChange={(event) => onChange({ ...form, assignLater: event.target.checked })}
      />
      {form.assignLater ? (
        pickupSoon && (
          <InlineAlert tone="warning" title="Pickup is within 12 hours">
            The trip will show “Vehicle or driver missing” on the board until you assign one.
          </InlineAlert>
        )
      ) : (
        <>
          <div className={styles.group}>
            <div className={styles.scrollOptions}>
              <RadioGroup
                id={fieldId('vehicleId')}
                legend={`Vehicle (${goodVehicles.length} free and suitable)`}
                hint={`${formatKg(options.weightKg)}${options.needsReefer ? ', refrigerated' : ''}. Smallest suitable vehicles first.`}
                name="wizard-vehicle"
                value={form.vehicleId}
                onChange={(vehicleId) => onChange({ ...form, vehicleId })}
                options={goodVehicles.map(({ vehicle }) => ({
                  value: vehicle.id,
                  label: `${vehicle.code} · ${VEHICLE_TYPES[vehicle.type].label}`,
                  description: `${formatKg(vehicle.capacityKg)}${vehicle.reefer ? ' · Refrigerated' : ''} · Based in ${cityName(vehicle.homeCityId)}`,
                }))}
                error={error('vehicleId')}
              />
            </div>
            <UnavailableOptions
              items={badVehicles.map(({ vehicle, reasons }) => ({
                id: vehicle.id,
                name: `${vehicle.code} · ${VEHICLE_TYPES[vehicle.type].label}`,
                reasons,
              }))}
            />
          </div>
          <div className={styles.group}>
            <div className={styles.scrollOptions}>
              <RadioGroup
                id={fieldId('driverId')}
                legend={`Driver (${goodDrivers.length} free)`}
                hint="Most rested first."
                name="wizard-driver"
                value={form.driverId}
                onChange={(driverId) => onChange({ ...form, driverId })}
                options={goodDrivers.map(({ driver }) => ({
                  value: driver.id,
                  label: driver.name,
                  description: `${driver.licence} licence · ${driver.drivingHoursLast24h} h driven in the last 24 h · ${cityName(driver.homeCityId)}`,
                }))}
                error={error('driverId')}
              />
            </div>
            <UnavailableOptions items={badDrivers.map(({ driver, reasons }) => ({ id: driver.id, name: driver.name, reasons }))} />
          </div>
        </>
      )}
    </div>
  );
}
