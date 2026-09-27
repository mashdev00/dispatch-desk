'use client';

import { useState } from 'react';
import { ArrowLeftRight, Ban, SearchX, StickyNote } from 'lucide-react';
import { getClient } from '@/lib/lookups';
import { useHydrated, useTrip } from '@/lib/store';
import { getTripSummary } from '@/lib/trips';
import type { ExceptionActionId, Trip, TripException } from '@/lib/types';
import { EXCEPTION_ACTIONS } from '@/lib/exceptions';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import ExceptionsPanel from './ExceptionsPanel';
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
  const [dialog, setDialog] = useState<DialogState | null>(null);
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
          {/* Session 10: activity feed with the add-note form (id="add-note"). */}
        </div>
        <aside className={styles.side} aria-label="Trip details">
          <TripDetails trip={trip} onMarkDocument={(document) => setDialog({ type: 'document', document })} />
          <TemperatureChart trip={trip} />
        </aside>
      </div>
      {/* Session 10 renders the dialog for this state. */}
      {dialog && <p className="visually-hidden" aria-live="polite">{`Dialog coming soon: ${dialog.type}`}</p>}
    </>
  );
}
