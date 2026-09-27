'use client';

import { useState } from 'react';
import { stopLabel } from '@/lib/lookups';
import { actions } from '@/lib/store';
import { DEMO_NOW_ISO, formatWindow, fromInputValue, toInputValue, toMs } from '@/lib/time';
import type { FormIssue, Stop, Trip } from '@/lib/types';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorSummary from '@/components/ui/ErrorSummary';
import TextField from '@/components/ui/TextField';
import TextareaField from '@/components/ui/TextareaField';
import { fieldId, issueFor } from '@/components/ui/fieldId';
import { issue, type DialogProps } from './dialogForm';
import styles from './Dialogs.module.css';

type Props = DialogProps & { trip: Trip; stop: Stop };

export default function RescheduleDialog({ open, onClose, onDone, trip, stop }: Props) {
  const [start, setStart] = useState(toInputValue(stop.windowStart));
  const [end, setEnd] = useState(toInputValue(stop.windowEnd));
  const [note, setNote] = useState('');
  const [issues, setIssues] = useState<FormIssue[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const found: FormIssue[] = [];
    const s = fromInputValue(start);
    const e = fromInputValue(end);
    if (!s) found.push(issue('windowStart', 'Enter when the new window opens.'));
    if (!e) found.push(issue('windowEnd', 'Enter when the new window closes.'));
    if (s && e && toMs(e) <= toMs(s)) found.push(issue('windowEnd', 'The window must close after it opens.'));
    if (!note.trim()) found.push(issue('reason', 'Give a reason, for example "Client agreed by phone".'));
    return found;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setSubmitted(true);
    setIssues(found);
    if (found.length) return;
    actions.rescheduleStop(trip.id, stop.id, { windowStart: fromInputValue(start)!, windowEnd: fromInputValue(end)!, note });
    onDone(`${stopLabel(trip, stop)} rescheduled`);
  }

  const recheck = () => submitted && setIssues(validate());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reschedule stop"
      description={`${stopLabel(trip, stop)} · ${stop.siteName}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="reschedule-form">
            Reschedule
          </Button>
        </>
      }
    >
      <form id="reschedule-form" onSubmit={submit} noValidate className={styles.form}>
        <ErrorSummary issues={issues} fieldId={fieldId} />
        <div className={styles.context}>
          <strong>Current window</strong>
          {formatWindow(stop.windowStart, stop.windowEnd)}
        </div>
        <div className={styles.row}>
          <TextField
            id={fieldId('windowStart')}
            type="datetime-local"
            label="New window opens"
            value={start}
            min={toInputValue(DEMO_NOW_ISO)}
            onChange={(event) => setStart(event.target.value)}
            onBlur={recheck}
            error={issueFor(issues, 'windowStart')}
          />
          <TextField
            id={fieldId('windowEnd')}
            type="datetime-local"
            label="New window closes"
            value={end}
            min={toInputValue(DEMO_NOW_ISO)}
            onChange={(event) => setEnd(event.target.value)}
            onBlur={recheck}
            error={issueFor(issues, 'windowEnd')}
          />
        </div>
        <TextareaField
          id={fieldId('reason')}
          label="Reason"
          hint="For example: Client agreed by phone."
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={recheck}
          error={issueFor(issues, 'reason')}
        />
      </form>
    </Dialog>
  );
}
