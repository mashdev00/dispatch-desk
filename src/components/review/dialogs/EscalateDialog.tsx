'use client';

import { useState } from 'react';
import { ESCALATION_TARGETS, type EscalationTargetId } from '@/lib/config';
import { actions } from '@/lib/store';
import type { FormIssue, Trip, TripException } from '@/lib/types';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorSummary from '@/components/ui/ErrorSummary';
import RadioGroup from '@/components/ui/RadioGroup';
import TextareaField from '@/components/ui/TextareaField';
import { fieldId, issueFor } from '@/components/ui/fieldId';
import { issue, type DialogProps } from './dialogForm';
import styles from './Dialogs.module.css';

type Props = DialogProps & { trip: Trip; exception?: TripException };

export default function EscalateDialog({ open, onClose, onDone, trip, exception }: Props) {
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [issues, setIssues] = useState<FormIssue[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function validate(nextTo = to, nextNote = note) {
    const found: FormIssue[] = [];
    if (!nextTo) found.push(issue('escalateTo', 'Choose who to escalate to.'));
    if (!nextNote.trim()) found.push(issue('escalateNote', 'Say what you need from them.'));
    return found;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setSubmitted(true);
    setIssues(found);
    if (found.length) return;
    actions.escalate(trip.id, { to: to as EscalationTargetId, note, exceptionKey: exception?.key });
    const target = ESCALATION_TARGETS.find((t) => t.id === to);
    onDone(`Escalated to ${target?.person ?? 'the team'}`);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Escalate"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="escalate-form">
            Escalate
          </Button>
        </>
      }
    >
      <form id="escalate-form" onSubmit={submit} noValidate className={styles.form}>
        <ErrorSummary issues={issues} fieldId={fieldId} />
        {exception && (
          <div className={styles.context}>
            <strong>{exception.title}</strong>
            {exception.detail}
          </div>
        )}
        <RadioGroup
          id={fieldId('escalateTo')}
          legend="Escalate to"
          name="escalate-to"
          value={to}
          onChange={(value) => {
            setTo(value);
            if (submitted) setIssues(validate(value));
          }}
          options={ESCALATION_TARGETS.map((t) => ({ value: t.id, label: t.label, description: t.person }))}
          error={issueFor(issues, 'escalateTo')}
        />
        <TextareaField
          id={fieldId('escalateNote')}
          label="Note"
          hint="What do you need them to decide or do?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => submitted && setIssues(validate())}
          error={issueFor(issues, 'escalateNote')}
        />
      </form>
    </Dialog>
  );
}
