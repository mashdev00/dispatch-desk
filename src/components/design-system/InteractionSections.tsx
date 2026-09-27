'use client';

import { useMemo, useState } from 'react';
import { EXCEPTION_ACTIONS, EXCEPTION_RULES } from '@/lib/exceptions';
import { formatKg } from '@/lib/format';
import { WIZARD_STEPS } from '@/lib/wizard';
import type { FormIssue } from '@/lib/types';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorSummary from '@/components/ui/ErrorSummary';
import SortHeader, { type SortDirection } from '@/components/ui/SortHeader';
import Stepper from '@/components/ui/Stepper';
import TextField from '@/components/ui/TextField';
import { fieldId, issueFor } from '@/components/ui/fieldId';
import { useToast } from '@/components/ui/Toast';
import tableStyles from '@/components/ui/Table.module.css';
import Section, { Sample } from './Section';
import styles from './DesignSystemPage.module.css';

export function DialogSection() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const toast = useToast();

  function close() {
    setOpen(false);
    setNote('');
    setError(undefined);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) {
      setError('Enter a note.');
      return;
    }
    close();
    toast('Note added');
  }

  return (
    <Section
      id="dialog"
      title="Dialog and toast"
      description="Dialogs use the native <dialog> element: focus moves in, Tab stays inside, Esc closes, and focus returns to the button that opened it. A toast confirms what happened."
    >
      <Sample label="Dialog">
        <Button onClick={() => setOpen(true)}>Add note</Button>
        <Dialog
          open={open}
          onClose={close}
          title="Add note"
          description="Everyone on the dispatch team can see notes."
          size="sm"
          footer={
            <>
              <Button onClick={close}>Cancel</Button>
              <Button variant="primary" type="submit" form="ds-note-form">
                Add note
              </Button>
            </>
          }
        >
          <form id="ds-note-form" onSubmit={submit} noValidate>
            <TextField label="Note" value={note} onChange={(event) => setNote(event.target.value)} error={error} />
          </form>
        </Dialog>
      </Sample>
      <Sample label="Toast">
        <Button onClick={() => toast('Trip TRP-24152 created')}>Show a toast</Button>
      </Sample>
    </Section>
  );
}

export function StepperSection() {
  const [current, setCurrent] = useState(1);
  return (
    <Section id="stepper" title="Stepper" description="Steps you have reached are buttons, so you can jump back. The text line always says where you are; on phones it replaces the labels.">
      <Sample label="Step 2 of 4, step 3 reached" wide>
        <Stepper steps={WIZARD_STEPS} current={current} maxReached={2} onStepClick={setCurrent} />
      </Sample>
    </Section>
  );
}

const SAMPLE_ISSUES: FormIssue[] = [
  { step: 1, field: 'ds.clientId', message: 'Choose a client.' },
  { step: 1, field: 'ds.weightKg', message: 'Enter the weight in kilograms.' },
];

export function ErrorSummarySection() {
  const [issues, setIssues] = useState<FormIssue[]>([]);
  return (
    <Section
      id="error-summary"
      title="Error summary"
      description="Shown at the top of a form when Next or Save fails. It takes focus, and each link jumps to its field."
    >
      <Sample label="Pattern" wide>
        <div className={styles.stack}>
          <div className={styles.row}>
            <Button onClick={() => setIssues(SAMPLE_ISSUES)}>Submit with errors</Button>
            {issues.length > 0 && (
              <Button variant="ghost" onClick={() => setIssues([])}>
                Clear
              </Button>
            )}
          </div>
          <ErrorSummary issues={issues} fieldId={fieldId} />
          <div className={styles.formSample}>
            <TextField id={fieldId('ds.clientId')} label="Client" error={issueFor(issues, 'ds.clientId')} />
            <TextField
              id={fieldId('ds.weightKg')}
              label="Weight"
              suffix="kg"
              inputMode="numeric"
              error={issueFor(issues, 'ds.weightKg')}
            />
          </div>
        </div>
      </Sample>
    </Section>
  );
}

const SAMPLE_ROWS = [
  { id: 'TRP-24118', client: 'Saffron Hill Foods', weight: 12000 },
  { id: 'TRP-24103', client: 'Kestrel Pharma', weight: 3200 },
  { id: 'TRP-24127', client: 'Greyrock Cement', weight: 18500 },
];

type SortKey = 'id' | 'client' | 'weight';

export function TableSection() {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  function cycle(key: SortKey) {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'ascending' };
      if (current.direction === 'ascending') return { key, direction: 'descending' };
      return null;
    });
  }

  const rows = useMemo(() => {
    if (!sort) return SAMPLE_ROWS;
    const sign = sort.direction === 'ascending' ? 1 : -1;
    return [...SAMPLE_ROWS].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sign;
    });
  }, [sort]);

  const directionFor = (key: SortKey): SortDirection => (sort?.key === key ? sort.direction : 'none');

  return (
    <Section
      id="table"
      title="Table"
      description="Sticky header, 48px rows, no zebra stripes. Sortable headers cycle ascending, descending, then back to the default order."
    >
      <Sample label="Sortable" wide>
        <div className={tableStyles.container} tabIndex={0} role="region" aria-label="Sample trips table">
          <table className={tableStyles.table}>
            <caption className="visually-hidden">Sample trips</caption>
            <thead>
              <tr>
                <SortHeader label="Trip" direction={directionFor('id')} onSort={() => cycle('id')} />
                <SortHeader label="Client" direction={directionFor('client')} onSort={() => cycle('client')} />
                <SortHeader
                  label="Weight"
                  direction={directionFor('weight')}
                  onSort={() => cycle('weight')}
                  className={tableStyles.number}
                />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.client}</td>
                  <td className={tableStyles.number}>{formatKg(row.weight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sample>
    </Section>
  );
}

export function ExceptionRulesSection() {
  return (
    <Section
      id="exception-rules"
      title="Exception rules"
      description="What makes a trip need attention. The rules are configuration: this table is built from the same list the app uses."
    >
      <Sample label={`${EXCEPTION_RULES.length} rules`} wide>
        <div className={tableStyles.container} tabIndex={0} role="region" aria-label="Exception rules table">
          <table className={tableStyles.table}>
            <caption className="visually-hidden">Exception rules</caption>
            <thead>
              <tr>
                <th scope="col">Rule</th>
                <th scope="col">When it fires</th>
                <th scope="col">Suggested actions</th>
              </tr>
            </thead>
            <tbody>
              {EXCEPTION_RULES.map((rule) => (
                <tr key={rule.id}>
                  <td className={styles.ruleTitle}>{rule.title}</td>
                  <td>{rule.description}</td>
                  <td>{rule.actions.map((action) => EXCEPTION_ACTIONS[action].label).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sample>
    </Section>
  );
}
