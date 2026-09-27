'use client';

import { useState } from 'react';
import { ArrowLeftRight, Ban, SearchX, StickyNote } from 'lucide-react';
import { getClient } from '@/lib/lookups';
import { useHydrated, useTrip } from '@/lib/store';
import { getTripSummary } from '@/lib/trips';
import type { ExceptionActionId, Trip, TripException } from '@/lib/types';
import { EXCEPTION_ACTIONS, getTripExceptions } from '@/lib/exceptions';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import ActivityFeed from './ActivityFeed';
import ExceptionsPanel from './ExceptionsPanel';
import AssignDialog from './dialogs/AssignDialog';
import CancelTripDialog from './dialogs/CancelTripDialog';
import ConfirmDocumentDialog from './dialogs/ConfirmDocumentDialog';
import EscalateDialog from './dialogs/EscalateDialog';
import RecordActionDialog from './dialogs/RecordActionDialog';
import RescheduleDialog from './dialogs/RescheduleDialog';
import StopTimeline from './StopTimeline';
import TemperatureChart from './TemperatureChart';
import TripDetails from './TripDetails';
import styles from './TripReview.module.css';

export type DialogState = {
  type: 'assign' | 'reschedule' | 'record' | 'escalate' | 'document' | 'cancel';
  exceptionKey?: string;
  actionId?: ExceptionActionId;
  stopId?: string | null;
  document?: 'consignmentNote' | 'pod';
};

function ReviewSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading trip">
      <Skeleton width={120} height={14} />
      <Skeleton width={280} height={28} />
      <Skeleton width="60%" height={16} />
      <div className={styles.layout}>
        <div className={styles.main}>
          <Skeleton height={140} />
          <Skeleton height={220} />
        </div>
        <div className={styles.side}>
          <Skeleton height={160} />
          <Skeleton height={160} />
        </div>
      </div>
    </div>
  );
}

export default function TripReview({ id }: { id: string }) {
  const hydrated = useHydrated();
  const trip = useTrip(id);

  if (!hydrated) return <ReviewSkeleton />;
  if (!trip) {
    return (
      <EmptyState
        icon={<SearchX />}
        titleAs="h1"
        title="Trip not found"
        description={`There's no trip ${id}. It may have been removed when the demo data was reset.`}
        action={<ButtonLink href="/trips">All trips</ButtonLink>}
      />
    );
  }
  return <TripReviewContent trip={trip} />;
}

function TripReviewContent({ trip }: { trip: Trip }) {
  // The dialog content stays mounted after closing so the native <dialog> can return focus
  // to its opener. `dialogKey` gives every opening a fresh form.
  const [dialog, setDialogState] = useState<DialogState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const toast = useToast();
  const setDialog = (next: DialogState) => {
    setDialogState(next);
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  };
  const closeDialog = () => setDialogOpen(false);
  const finishDialog = (message: string) => {
    setDialogOpen(false);
    toast(message);
  };
  const summary = getTripSummary(trip);
  const client = getClient(trip.clientId);
  const canChange = trip.status === 'scheduled' || trip.status === 'in_transit';

  function openForException(exception: TripException, actionId: ExceptionActionId) {
    const kind = EXCEPTION_ACTIONS[actionId].kind;
    setDialog({
      type: kind,
      exceptionKey: exception.key,
      actionId,
      stopId: exception.stopId,
      document: actionId === 'mark_pod_received' ? 'pod' : actionId === 'mark_note_received' ? 'consignmentNote' : undefined,
    });
  }

  function focusNote() {
    document.getElementById('add-note')?.focus();
  }

  return (
    <>
      <PageHeader
        back={{ href: '/trips', label: 'All trips' }}
        title={trip.id}
        actions={
          <>
            {canChange && (
              <Button icon={<ArrowLeftRight />} onClick={() => setDialog({ type: 'assign' })}>
                Reassign
              </Button>
            )}
            <Button icon={<StickyNote />} onClick={focusNote}>
              Add note
            </Button>
            {canChange && (
              <Button variant="ghost" icon={<Ban />} onClick={() => setDialog({ type: 'cancel' })}>
                Cancel trip
              </Button>
            )}
          </>
        }
      />
      <div className={styles.meta}>
        <StatusBadge status={trip.status} />
        <span className={styles.route}>{summary.route}</span>
        <span>{client?.name ?? '—'}</span>
        {trip.reference && <span className={styles.muted}>Ref. {trip.reference}</span>}
        {trip.cancelReason && <span className={styles.muted}>Cancelled: {trip.cancelReason}</span>}
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <ExceptionsPanel trip={trip} onAction={openForException} />
          <StopTimeline trip={trip} onReschedule={(stopId) => setDialog({ type: 'reschedule', stopId })} />
          <ActivityFeed trip={trip} />
        </div>
        <aside className={styles.side} aria-label="Trip details">
          <TripDetails trip={trip} onMarkDocument={(document) => setDialog({ type: 'document', document })} />
          <TemperatureChart trip={trip} />
        </aside>
      </div>
      {dialog && (
        <TripDialog
          key={dialogKey}
          trip={trip}
          dialog={dialog}
          open={dialogOpen}
          onClose={closeDialog}
          onDone={finishDialog}
        />
      )}
    </>
  );
}

type TripDialogProps = {
  trip: Trip;
  dialog: DialogState;
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
};

/** Picks the dialog for the current state. Action kinds come from EXCEPTION_ACTIONS. */
function TripDialog({ trip, dialog, ...props }: TripDialogProps) {
  const exception = dialog.exceptionKey
    ? getTripExceptions(trip).find((e) => e.key === dialog.exceptionKey)
    : undefined;

  switch (dialog.type) {
    case 'assign':
      return <AssignDialog trip={trip} {...props} />;
    case 'reschedule': {
      const stop = trip.stops.find((s) => s.id === dialog.stopId);
      return stop ? <RescheduleDialog trip={trip} stop={stop} {...props} /> : null;
    }
    case 'record':
      return exception && dialog.actionId ? (
        <RecordActionDialog trip={trip} exception={exception} actionId={dialog.actionId} {...props} />
      ) : null;
    case 'escalate':
      return <EscalateDialog trip={trip} exception={exception} {...props} />;
    case 'document':
      return dialog.document ? <ConfirmDocumentDialog trip={trip} document={dialog.document} {...props} /> : null;
    case 'cancel':
      return <CancelTripDialog trip={trip} {...props} />;
  }
}
