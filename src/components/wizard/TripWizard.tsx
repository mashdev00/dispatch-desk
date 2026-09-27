'use client';

import { FileQuestion } from 'lucide-react';
import { useDraft, useHydrated } from '@/lib/store';
import ButtonLink from '@/components/ui/ButtonLink';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import WizardForm from './WizardForm';
import styles from './WizardForm.module.css';

export default function TripWizard({ draftId }: { draftId?: string }) {
  const hydrated = useHydrated();
  const draft = useDraft(draftId ?? '');

  if (draftId && !hydrated) {
    return (
      <div aria-busy="true" aria-label="Loading draft" className={styles.loading}>
        <Skeleton width={200} height={28} />
        <Skeleton height={48} />
        <Skeleton height={320} />
      </div>
    );
  }
  if (draftId && !draft) {
    return (
      <EmptyState
        icon={<FileQuestion />}
        titleAs="h1"
        title="Draft not found"
        description={`There's no draft ${draftId}. It may have been created or discarded already.`}
        action={<ButtonLink href="/trips">All trips</ButtonLink>}
      />
    );
  }
  // Keying by id starts the form fresh from the draft; no effect is needed to copy it.
  return <WizardForm key={draft?.id ?? 'new'} initialDraft={draft ?? null} />;
}
