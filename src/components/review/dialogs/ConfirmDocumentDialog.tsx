'use client';

import { actions } from '@/lib/store';
import type { Trip } from '@/lib/types';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import type { DialogProps } from './dialogForm';

type Props = DialogProps & { trip: Trip; document: 'consignmentNote' | 'pod' };

const NAMES = { consignmentNote: 'consignment note (bilty)', pod: 'proof of delivery (POD)' };

export default function ConfirmDocumentDialog({ open, onClose, onDone, trip, document }: Props) {
  const name = NAMES[document];
  function confirm() {
    actions.markDocumentReceived(trip.id, document);
    onDone(`${document === 'pod' ? 'POD' : 'Consignment note'} marked as received`);
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Mark received"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={confirm}>
            Mark received
          </Button>
        </>
      }
    >
      <p>
        Confirm that you have the {name} for {trip.id}.
      </p>
    </Dialog>
  );
}
