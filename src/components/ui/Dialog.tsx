'use client';

import { useEffect, useId, useRef } from 'react';
import { cx } from './cx';
import styles from './Dialog.module.css';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  size?: 'sm' | 'md';
};

export default function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      opener.current?.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, styles[size])}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
      <div className={styles.body}>{children}</div>
      <div className={styles.footer}>{footer}</div>
    </dialog>
  );
}
