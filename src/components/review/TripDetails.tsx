'use client';

import { CARGO_CATEGORIES, VEHICLE_TYPES } from '@/lib/config';
import { formatKg, formatTempRange } from '@/lib/format';
import { getDriver, getVehicle } from '@/lib/lookups';
import type { Trip } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { TONE_ICONS } from '@/components/ui/toneIcons';
import styles from './TripDetails.module.css';

type DocumentKey = 'consignmentNote' | 'pod';

type TripDetailsProps = { trip: Trip; onMarkDocument: (document: DocumentKey) => void };

const DOCUMENTS: { key: DocumentKey; label: string }[] = [
  { key: 'consignmentNote', label: 'Consignment note (bilty)' },
  { key: 'pod', label: 'Proof of delivery (POD)' },
];

function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className={styles.facts}>
      {items.map(([term, value]) => (
        <div key={term} className={styles.fact}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function TripDetails({ trip, onMarkDocument }: TripDetailsProps) {
  const vehicle = getVehicle(trip.vehicleId);
  const driver = getDriver(trip.driverId);
  const { cargo } = trip;
  const Received = TONE_ICONS.success;
  const Missing = TONE_ICONS.warning;
  const NotYet = TONE_ICONS.neutral;
  // Only flag a document as missing once it's due: the note when the truck leaves the pickup, the POD on delivery.
  const isDue = (key: DocumentKey) =>
    key === 'pod' ? trip.status === 'delivered' : trip.stops[0].departedAt !== null && trip.status !== 'cancelled';
  const canMark = (key: DocumentKey) =>
    trip.status !== 'cancelled' && (key === 'consignmentNote' || trip.status === 'delivered');

  return (
    <div className={styles.details}>
      <Card title="Cargo">
        <Facts
          items={[
            ['Type', CARGO_CATEGORIES[cargo.category].label],
            ['Description', cargo.description],
            ['Weight', formatKg(cargo.weightKg)],
            ['Pallets', cargo.pallets ?? '—'],
            ...(cargo.tempRangeC ? [['Temperature', formatTempRange(cargo.tempRangeC)] as [string, string]] : []),
          ]}
        />
      </Card>

      <Card title="Vehicle">
        {vehicle ? (
          <Facts
            items={[
              ['Code', vehicle.code],
              ['Plate', vehicle.plate],
              ['Type', VEHICLE_TYPES[vehicle.type].label],
              ['Capacity', formatKg(vehicle.capacityKg)],
              ['Refrigerated', vehicle.reefer ? 'Yes' : 'No'],
            ]}
          />
        ) : (
          <p className={styles.missing}>Not assigned</p>
        )}
      </Card>

      <Card title="Driver">
        {driver ? (
          <Facts
            items={[
              ['Name', driver.name],
              ['Phone', <a key="phone" href={`tel:${driver.phone.replace(/[^\d+]/g, '')}`}>{driver.phone}</a>],
              ['Licence', driver.licence],
              ['Driving, last 24 h', `${driver.drivingHoursLast24h} h`],
            ]}
          />
        ) : (
          <p className={styles.missing}>Not assigned</p>
        )}
      </Card>

      <Card title="Documents">
        <ul className={styles.documents}>
          {DOCUMENTS.map(({ key, label }) => {
            const received = trip.documents[key] === 'uploaded';
            return (
              <li key={key} className={styles.document}>
                <span className={styles.documentName}>{label}</span>
                {received ? (
                  <Badge tone="success" icon={<Received />}>
                    Received
                  </Badge>
                ) : isDue(key) ? (
                  <Badge tone="warning" icon={<Missing />}>
                    Missing
                  </Badge>
                ) : (
                  <Badge tone="neutral" icon={<NotYet />}>
                    Not due yet
                  </Badge>
                )}
                {!received && canMark(key) && (
                  <Button size="sm" onClick={() => onMarkDocument(key)} className={styles.markButton}>
                    Mark received<span className="visually-hidden">: {label}</span>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {trip.notes && (
        <Card title="Notes">
          <p className={styles.notes}>{trip.notes}</p>
        </Card>
      )}
    </div>
  );
}
