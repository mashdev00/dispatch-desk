'use client';

import { useMemo, useState } from 'react';
import { VEHICLE_TYPES } from '@/lib/config';
import { formatKg } from '@/lib/format';
import { busyWindow, cityName, getDriverOptions, getVehicleOptions } from '@/lib/lookups';
import { actions, useTrips } from '@/lib/store';
import type { FormIssue, Trip } from '@/lib/types';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorSummary from '@/components/ui/ErrorSummary';
import RadioGroup from '@/components/ui/RadioGroup';
import TextareaField from '@/components/ui/TextareaField';
import { fieldId, issueFor } from '@/components/ui/fieldId';
import UnavailableOptions from '@/components/assign/UnavailableOptions';
import { issue, type DialogProps } from './dialogForm';
import styles from './Dialogs.module.css';

type Props = DialogProps & { trip: Trip };

export default function AssignDialog({ open, onClose, onDone, trip }: Props) {
  const trips = useTrips();
  const { vehicleOptions, driverOptions } = useMemo(() => {
    const tripWindow = busyWindow(trip) ?? {
      start: trip.stops[0].windowStart,
      end: trip.stops[trip.stops.length - 1].windowEnd,
    };
    return {
      vehicleOptions: getVehicleOptions(trips, {
        weightKg: trip.cargo.weightKg,
        needsReefer: trip.cargo.tempRangeC !== null,
        window: tripWindow,
        excludeTripId: trip.id,
      }),
      driverOptions: getDriverOptions(trips, { window: tripWindow, excludeTripId: trip.id }),
    };
  }, [trips, trip]);

  const goodVehicles = vehicleOptions.filter((o) => o.available && o.fits);
  const badVehicles = vehicleOptions.filter((o) => !(o.available && o.fits));
  const goodDrivers = driverOptions.filter((o) => o.available);
  const badDrivers = driverOptions.filter((o) => !o.available);

  const [vehicleId, setVehicleId] = useState(
    goodVehicles.some((o) => o.vehicle.id === trip.vehicleId) ? (trip.vehicleId ?? '') : '',
  );
  const [driverId, setDriverId] = useState(
    goodDrivers.some((o) => o.driver.id === trip.driverId) ? (trip.driverId ?? '') : '',
  );
  const [note, setNote] = useState('');
  const [issues, setIssues] = useState<FormIssue[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function validate(v = vehicleId, d = driverId) {
    const found: FormIssue[] = [];
    if (!v) found.push(issue('vehicleId', 'Choose a vehicle that fits this trip.'));
    if (!d) found.push(issue('driverId', 'Choose a driver.'));
    return found;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setSubmitted(true);
    setIssues(found);
    if (found.length) return;
    if (vehicleId === trip.vehicleId && driverId === trip.driverId) {
      onClose();
      return;
    }
    actions.assign(trip.id, { vehicleId, driverId, note });
    onDone('Vehicle and driver updated');
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reassign vehicle or driver"
      description={`${formatKg(trip.cargo.weightKg)}${trip.cargo.tempRangeC ? ', needs a refrigerated truck' : ''}. Only vehicles and drivers free for the whole trip can be chosen.`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="assign-form">
            Save
          </Button>
        </>
      }
    >
      <form id="assign-form" onSubmit={submit} noValidate className={styles.form}>
        <ErrorSummary issues={issues} fieldId={fieldId} />
        <div className={styles.form}>
          <div className={styles.options}>
            <RadioGroup
              id={fieldId('vehicleId')}
              legend={`Vehicle (${goodVehicles.length} available)`}
              name="assign-vehicle"
              value={vehicleId}
              onChange={(value) => {
                setVehicleId(value);
                if (submitted) setIssues(validate(value));
              }}
              options={goodVehicles.map(({ vehicle }) => ({
                value: vehicle.id,
                label: `${vehicle.code} · ${VEHICLE_TYPES[vehicle.type].label}${vehicle.id === trip.vehicleId ? ' (current)' : ''}`,
                description: `${formatKg(vehicle.capacityKg)}${vehicle.reefer ? ' · Refrigerated' : ''} · ${cityName(vehicle.homeCityId)}`,
              }))}
              error={issueFor(issues, 'vehicleId')}
            />
          </div>
          <UnavailableOptions
            items={badVehicles.map(({ vehicle, reasons }) => ({
              id: vehicle.id,
              name: `${vehicle.code} · ${VEHICLE_TYPES[vehicle.type].label}${vehicle.id === trip.vehicleId ? ' (current)' : ''}`,
              reasons,
            }))}
          />
        </div>
        <div className={styles.form}>
          <div className={styles.options}>
            <RadioGroup
              id={fieldId('driverId')}
              legend={`Driver (${goodDrivers.length} available)`}
              name="assign-driver"
              value={driverId}
              onChange={(value) => {
                setDriverId(value);
                if (submitted) setIssues(validate(vehicleId, value));
              }}
              options={goodDrivers.map(({ driver }) => ({
                value: driver.id,
                label: `${driver.name}${driver.id === trip.driverId ? ' (current)' : ''}`,
                description: `${driver.licence} · ${driver.drivingHoursLast24h} h driven in 24 h · ${cityName(driver.homeCityId)}`,
              }))}
              error={issueFor(issues, 'driverId')}
            />
          </div>
          <UnavailableOptions
            items={badDrivers.map(({ driver, reasons }) => ({
              id: driver.id,
              name: `${driver.name}${driver.id === trip.driverId ? ' (current)' : ''}`,
              reasons,
            }))}
          />
        </div>
        <TextareaField label="Note (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
      </form>
    </Dialog>
  );
}
