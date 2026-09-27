import { useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cx } from './cx';
import styles from './Field.module.css';

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string; disabled?: boolean }[];
};

export default function SelectField({ label, hint, error, placeholder, options, id, className, ...rest }: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={selectId} className={styles.label}>
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
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(styles.input, error && styles.invalid)}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
