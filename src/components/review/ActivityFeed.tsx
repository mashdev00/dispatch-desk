'use client';

import { useState } from 'react';
import { actions } from '@/lib/store';
import { formatDateTime, formatSmart } from '@/lib/time';
import type { ActivityEvent, Trip } from '@/lib/types';
import Button from '@/components/ui/Button';
import TextareaField from '@/components/ui/TextareaField';
import { useToast } from '@/components/ui/Toast';
import { cx } from '@/components/ui/cx';
import styles from './ActivityFeed.module.css';

type Filter = 'all' | 'people' | 'system';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'people', label: 'People' },
  { value: 'system', label: 'System and driver app' },
];

const isMachine = (event: ActivityEvent) => event.actor === 'System' || event.actor === 'Driver app';

export default function ActivityFeed({ trip }: { trip: Trip }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [filter, setFilter] = useState<Filter>('all');
  const toast = useToast();

  function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) {
      setError('Write a note first.');
      return;
    }
    actions.addNote(trip.id, note);
    setNote('');
    setError(undefined);
    toast('Note added');
  }

  const events = [...trip.activity]
    .reverse()
    .filter((e) => filter === 'all' || (filter === 'people' ? !isMachine(e) : isMachine(e)));

  return (
    <section aria-labelledby="activity-title" className={styles.panel}>
      <h2 id="activity-title" className={styles.title}>
        Activity
      </h2>
      <form onSubmit={addNote} noValidate className={styles.noteForm}>
        <TextareaField
          id="add-note"
          label="Add a note"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={error}
        />
        <Button type="submit" size="sm" className={styles.noteButton}>
          Add note
        </Button>
      </form>
      <div role="group" aria-label="Show activity from" className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cx(styles.filter, filter === f.value && styles.filterPressed)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {events.length === 0 ? (
        <p className={styles.empty}>Nothing here yet.</p>
      ) : (
        <ol className={styles.list}>
          {events.map((event) => (
            <li key={event.id} className={cx(styles.item, !isMachine(event) && styles.person)}>
              <time dateTime={event.at} title={formatDateTime(event.at)} className={styles.time}>
                {formatSmart(event.at)}
              </time>
              <div className={styles.body}>
                <span className={styles.actor}>{event.actor}</span>
                <p>{event.message}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
