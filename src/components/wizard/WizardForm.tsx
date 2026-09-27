'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { actions, useDraft, useTrips } from '@/lib/store';
import { formatTime } from '@/lib/time';
import type { FormIssue, TripDraft, TripForm, WizardStep } from '@/lib/types';
import { WIZARD_STEPS, createEmptyForm, validateStep } from '@/lib/wizard';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorSummary from '@/components/ui/ErrorSummary';
import Stepper from '@/components/ui/Stepper';
import { useToast } from '@/components/ui/Toast';
import { fieldId } from '@/components/ui/fieldId';
import StepCargo from './StepCargo';
import StepAssign from './StepAssign';
import StepReview from './StepReview';
import StepRoute from './StepRoute';
import styles from './WizardForm.module.css';

const LAST_STEP = WIZARD_STEPS.length as WizardStep;

/** True once the user has typed or picked anything, so an empty form never becomes a draft. */
function hasData(form: TripForm): boolean {
  const { stops, assignLater, ...fields } = form;
  const stopHasData = (stop: TripForm['stops'][number]) =>
    [stop.cityId, stop.siteName, stop.address, stop.contactName, stop.contactPhone, stop.windowStart, stop.windowEnd].some(
      (value) => value.trim() !== '',
    );
  return assignLater || stops.length > 2 || Object.values(fields).some((value) => value.trim() !== '') || stops.some(stopHasData);
}

export default function WizardForm({ initialDraft }: { initialDraft: TripDraft | null }) {
  const router = useRouter();
  const toast = useToast();
  const trips = useTrips();

  const [form, setForm] = useState<TripForm>(() => initialDraft?.form ?? createEmptyForm());
  const [step, setStep] = useState<WizardStep>(() => initialDraft?.step ?? 1);
  const [maxReached, setMaxReached] = useState<WizardStep>(() => initialDraft?.step ?? 1);
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const [issues, setIssues] = useState<FormIssue[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const draft = useDraft(draftId ?? '');
  const heading = useRef<HTMLDivElement>(null);

  function save(reached: WizardStep = maxReached, nextForm: TripForm = form) {
    const id = actions.saveDraft({ id: draftId, step: reached, form: nextForm });
    if (id !== draftId) {
      setDraftId(id);
      // Changes the URL without remounting the form.
      window.history.replaceState(null, '', '/drafts/' + id);
    }
    return id;
  }

  function goTo(next: WizardStep) {
    const reached = Math.max(maxReached, next) as WizardStep;
    setMaxReached(reached);
    setStep(next);
    setIssues([]);
    setShowErrors(false);
    if (hasData(form)) save(reached);
    heading.current?.scrollIntoView({ block: 'start' });
  }

  function next() {
    const found = validateStep(form, step, trips);
    if (found.length) {
      setIssues(found);
      setShowErrors(true);
      return;
    }
    if (step < LAST_STEP) {
      goTo((step + 1) as WizardStep);
      return;
    }
    const result = actions.submitTrip(form, draftId);
    if (result.ok) {
      toast(`Trip ${result.tripId} created`);
      router.push('/trips/' + result.tripId);
      return;
    }
    // Go to the first step with problems and show them there.
    const firstStep = Math.min(...result.issues.map((i) => i.step)) as WizardStep;
    setStep(firstStep);
    setIssues(result.issues.filter((i) => i.step === firstStep));
    setShowErrors(true);
  }

  function update(nextForm: TripForm) {
    setForm(nextForm);
    // After a failed Next, keep the errors in step with what the user fixes.
    if (showErrors) setIssues(validateStep(nextForm, step, trips));
  }

  function saveDraft() {
    save();
    toast('Draft saved');
  }

  function discard() {
    if (draftId) actions.deleteDraft(draftId);
    setDiscardOpen(false);
    toast('Draft discarded');
    router.push('/trips');
  }

  const stepIssues = showErrors ? issues : [];

  return (
    <div className={styles.wizard}>
      <div ref={heading}>
        <PageHeader
          title={draftId ? `Draft ${draftId}` : 'New trip'}
          description={draft ? `Draft saved at ${formatTime(draft.updatedAt)}` : 'Four steps. Nothing is created until you confirm on the last one.'}
        />
      </div>
      <Stepper
        steps={WIZARD_STEPS}
        current={step - 1}
        maxReached={maxReached - 1}
        onStepClick={(index) => goTo((index + 1) as WizardStep)}
      />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          next();
        }}
        className={styles.form}
      >
        <ErrorSummary issues={stepIssues} fieldId={fieldId} />
        <h2 className={styles.stepTitle}>{WIZARD_STEPS[step - 1].label}</h2>
        {step === 1 && <StepCargo form={form} onChange={update} issues={issues} showErrors={showErrors} />}
        {step === 2 && <StepRoute form={form} onChange={update} issues={issues} showErrors={showErrors} />}
        {step === 3 && (
          <StepAssign form={form} onChange={update} issues={issues} showErrors={showErrors} onGoToStep={goTo} />
        )}
        {step === 4 && <StepReview form={form} onGoToStep={goTo} />}
        <div className={styles.footer}>
          <div className={styles.footerStart}>
            {step > 1 && <Button onClick={() => goTo((step - 1) as WizardStep)}>Back</Button>}
            {draftId && (
              <Button variant="ghost" icon={<Trash2 />} onClick={() => setDiscardOpen(true)} className={styles.discard}>
                Discard draft
              </Button>
            )}
          </div>
          <div className={styles.footerEnd}>
            <Button onClick={saveDraft}>Save draft</Button>
            <Button variant="primary" type="submit">
              {step === LAST_STEP ? 'Create trip' : 'Next'}
            </Button>
          </div>
        </div>
      </form>
      <Dialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        size="sm"
        title="Discard this draft?"
        footer={
          <>
            <Button onClick={() => setDiscardOpen(false)}>Keep draft</Button>
            <Button variant="danger" onClick={discard}>
              Discard draft
            </Button>
          </>
        }
      >
        <p>Everything entered in {draftId} will be deleted. This can&apos;t be undone.</p>
      </Dialog>
    </div>
  );
}
