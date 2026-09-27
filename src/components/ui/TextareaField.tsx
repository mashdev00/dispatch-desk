import { useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cx } from './cx';
import styles from './Field.module.css';

type TextareaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export default function TextareaField({ label, hint, error, id, className, rows = 3, ...rest }: TextareaFieldProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const hintId = `${textareaId}-hint`;
  const errorId = `${textareaId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={textareaId} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(styles.input, error && styles.invalid)}
        {...rest}
      />
    </div>
  );
}
