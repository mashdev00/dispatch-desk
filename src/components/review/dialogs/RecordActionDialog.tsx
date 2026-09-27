'use client';

import { useState } from 'react';
import { EXCEPTION_ACTIONS } from '@/lib/exceptions';
import { actions } from '@/lib/store';
import type { ExceptionActionId, FormIssue, Trip, TripException } from '@/lib/types';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorSummary from '@/components/ui/ErrorSummary';
import RadioGroup from '@/components/ui/RadioGroup';
import TextareaField from '@/components/ui/TextareaField';
import { fieldId, issueFor } from '@/components/ui/fieldId';
import { issue, type DialogProps } from './dialogForm';
import styles from './Dialogs.module.css';

const DONE_MESSAGES: Partial<Record<ExceptionActionId, string>> = {
  contact_driver: 'Driver contact recorded',
  notify_client: 'Client notification recorded',
  plan_rest: 'Rest stop recorded',
};

type Props = DialogProps & { trip: Trip; exception: TripException; actionId: ExceptionActionId };

export default function RecordActionDialog({ open, onClose, onDone, trip, exception, actionId }: Props) {
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [issues, setIssues] = useState<FormIssue[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const formId = `record-${exception.key}`;

  function validate(nextOutcome = outcome, nextNote = note) {
    const found: FormIssue[] = [];
    if (!nextOutcome) found.push(issue('outcome', 'Choose what happened.'));
    if (nextOutcome === 'Other' && !nextNote.trim()) found.push(issue('note', 'Describe what happened.'));
    return found;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setSubmitted(true);
    setIssues(found);
    if (found.length) return;
    actions.recordAction(trip.id, exception.key, { actionId, outcome, note });
    onDone(DONE_MESSAGES[actionId] ?? 'Action recorded');
  }

  const label = EXCEPTION_ACTIONS[actionId].label;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={label}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId}>
            Save
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className={styles.form}>
        <ErrorSummary issues={issues} fieldId={fieldId} />
        <div className={styles.context}>
          <strong>{exception.title}</strong>
          {exception.detail}
        </div>
        <RadioGroup
          id={fieldId('outcome')}
          legend="What happened?"
          name={`${formId}-outcome`}
          value={outcome}
          onChange={(value) => {
            setOutcome(value);
            if (submitted) setIssues(validate(value));
          }}
          options={exception.outcomes.map((o) => ({ value: o, label: o }))}
          error={issueFor(issues, 'outcome')}
        />
        <TextareaField
          id={fieldId('note')}
          label={outcome === 'Other' ? 'Note' : 'Note (optional)'}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => submitted && setIssues(validate())}
          error={issueFor(issues, 'note')}
        />
      </form>
    </Dialog>
  );
}
