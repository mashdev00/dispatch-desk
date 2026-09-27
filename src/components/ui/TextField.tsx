import { useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cx } from './cx';
import styles from './Field.module.css';

type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;
  hint?: string;
  error?: string;
  suffix?: string;
};

export default function TextField({ label, hint, error, suffix, id, className, type = 'text', ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={styles.label}>
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
      <div className={styles.control}>
        <input
          id={inputId}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(styles.input, suffix && styles.withSuffix, error && styles.invalid)}
          {...rest}
        />
        {suffix && (
          <span className={styles.suffix} aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
