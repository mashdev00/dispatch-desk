'use client';

import { useState } from 'react';
import { CANCEL_REASONS } from '@/lib/config';
import { actions } from '@/lib/store';
import type { FormIssue, Trip } from '@/lib/types';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorSummary from '@/components/ui/ErrorSummary';
import RadioGroup from '@/components/ui/RadioGroup';
import TextareaField from '@/components/ui/TextareaField';
import { fieldId, issueFor } from '@/components/ui/fieldId';
import { issue, type DialogProps } from './dialogForm';
import styles from './Dialogs.module.css';

type Props = DialogProps & { trip: Trip };

export default function CancelTripDialog({ open, onClose, onDone, trip }: Props) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [issues, setIssues] = useState<FormIssue[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function validate(r = reason, n = note) {
    const found: FormIssue[] = [];
    if (!r) found.push(issue('cancelReason', 'Choose why the trip is cancelled.'));
    if (r === 'Other' && !n.trim()) found.push(issue('cancelNote', 'Describe why the trip is cancelled.'));
    return found;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setSubmitted(true);
    setIssues(found);
    if (found.length) return;
    actions.cancelTrip(trip.id, reason, note);
    onDone(`Trip ${trip.id} cancelled`);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Cancel ${trip.id}?`}
      description="The trip stays in the list as cancelled. This can't be undone."
      footer={
        <>
          <Button onClick={onClose}>Keep trip</Button>
          <Button variant="danger" type="submit" form="cancel-form">
            Cancel trip
          </Button>
        </>
      }
    >
      <form id="cancel-form" onSubmit={submit} noValidate className={styles.form}>
        <ErrorSummary issues={issues} fieldId={fieldId} />
        <RadioGroup
          id={fieldId('cancelReason')}
          legend="Reason"
          name="cancel-reason"
          value={reason}
          onChange={(value) => {
            setReason(value);
            if (submitted) setIssues(validate(value));
          }}
          options={CANCEL_REASONS.map((r) => ({ value: r, label: r }))}
          error={issueFor(issues, 'cancelReason')}
        />
        <TextareaField
          id={fieldId('cancelNote')}
          label={reason === 'Other' ? 'Note' : 'Note (optional)'}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => submitted && setIssues(validate())}
          error={issueFor(issues, 'cancelNote')}
        />
      </form>
    </Dialog>
  );
}
