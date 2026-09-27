import type { FormIssue } from '@/lib/types';

/** Dialog fields have no wizard step; FormIssue needs one, so dialogs use step 1. */
export const issue = (field: string, message: string): FormIssue => ({ step: 1, field, message });

/** Every dialog's props. onDone closes the dialog and shows the toast message. */
export type DialogProps = { open: boolean; onClose: () => void; onDone: (message: string) => void };
