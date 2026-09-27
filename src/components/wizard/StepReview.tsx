'use client';

import { useMemo } from 'react';
import { CircleCheck } from 'lucide-react';
import { CARGO_CATEGORIES, VEHICLE_TYPES } from '@/lib/config';
import { getOpenExceptions } from '@/lib/exceptions';
import { formatTempRange } from '@/lib/format';
import { cityName, getClient, getDriver, getVehicle } from '@/lib/lookups';
import { formatWindow, fromInputValue } from '@/lib/time';
import type { TripForm, WizardStep } from '@/lib/types';
import { formWeightLabel, getPlanWarnings, previewTrip } from '@/lib/wizard';
import Button from '@/components/ui/Button';
import InlineAlert from '@/components/ui/InlineAlert';
import SeverityBadge from '@/components/ui/SeverityBadge';
import styles from './StepReview.module.css';

type StepReviewProps = { form: TripForm; onGoToStep: (step: WizardStep) => void };

function Section({ title, step, onGoToStep, children }: { title: string; step: WizardStep; onGoToStep: (step: WizardStep) => void; children: React.ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={`review-${step}`}>
      <div className={styles.sectionHeader}>
        <h3 id={`review-${step}`} className={styles.sectionTitle}>
          {title}
        </h3>
        <Button size="sm" variant="ghost" onClick={() => onGoToStep(step)}>
          Change<span className="visually-hidden"> {title.toLowerCase()}</span>
        </Button>
      </div>
      {children}
    </section>
  );
}

function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className={styles.facts}>
      {items.map(([term, value]) => (
        <div key={term} className={styles.fact}>
          <dt>{term}</dt>
          <dd>{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function windowText(start: string, end: string) {
  const s = fromInputValue(start);
  const e = fromInputValue(end);
  return s && e ? formatWindow(s, e) : '—';
}

export default function StepReview({ form, onGoToStep }: StepReviewProps) {
  const exceptions = useMemo(() => {
    const trip = previewTrip(form);
    return trip ? getOpenExceptions(trip) : [];
  }, [form]);
  const warnings = getPlanWarnings(form);
  const category = form.cargoCategory ? CARGO_CATEGORIES[form.cargoCategory] : null;
  const vehicle = getVehicle(form.vehicleId);
  const driver = getDriver(form.driverId);

  return (
    <div className={styles.review}>
      <section className={styles.checks} aria-labelledby="checks-title">
        <h3 id="checks-title" className={styles.sectionTitle}>
          Checks
        </h3>
        {exceptions.length === 0 && warnings.length === 0 ? (
          <p className={styles.noProblems}>
            <CircleCheck size={18} aria-hidden="true" />
            No problems found.
          </p>
        ) : (
          <ul className={styles.checkList}>
            {exceptions.map((e) => (
              <li key={e.key} className={styles.check}>
                <SeverityBadge severity={e.severity} />
                <span>
                  <strong>{e.title}.</strong> {e.detail}
                </span>
              </li>
            ))}
            {warnings.map((warning) => (
              <li key={warning} className={styles.check}>
                <SeverityBadge severity="warning" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Section title="Client and cargo" step={1} onGoToStep={onGoToStep}>
        <Facts
          items={[
            ['Client', getClient(form.clientId)?.name],
            ['Order reference', form.reference],
            ['Cargo type', category?.label],
            ['Description', form.cargoDescription],
            ['Weight', formWeightLabel(form)],
            ['Pallets', form.pallets],
            ...(category?.tempRangeC ? [['Temperature', formatTempRange(category.tempRangeC)] as [string, string]] : []),
          ]}
        />
      </Section>

      <Section title="Route and stops" step={2} onGoToStep={onGoToStep}>
        <ol className={styles.stops}>
          {form.stops.map((stop, index) => (
            <li key={stop.key}>
              <strong>{index === 0 ? 'Pickup' : form.stops.length > 2 ? `Drop ${index}` : 'Drop'}</strong> ·{' '}
              {cityName(stop.cityId)} · {stop.siteName || '—'}
              <br />
              <span className={styles.muted}>{windowText(stop.windowStart, stop.windowEnd)}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Vehicle and driver" step={3} onGoToStep={onGoToStep}>
        {form.assignLater ? (
          <InlineAlert tone="info">Assign later: no vehicle or driver yet.</InlineAlert>
        ) : (
          <Facts
            items={[
              ['Vehicle', vehicle ? `${vehicle.code} · ${VEHICLE_TYPES[vehicle.type].label}` : null],
              ['Driver', driver ? `${driver.name} · ${driver.licence}` : null],
            ]}
          />
        )}
      </Section>
    </div>
  );
}
