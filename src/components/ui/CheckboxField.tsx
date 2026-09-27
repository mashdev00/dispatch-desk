import { useId } from 'react';
import { cx } from './cx';
import styles from './Field.module.css';

type CheckboxFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  hint?: string;
};

export default function CheckboxField({ label, hint, id, className, ...rest }: CheckboxFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cx(styles.check, className)}>
      <input
        id={inputId}
        type="checkbox"
        aria-describedby={hint ? hintId : undefined}
        className={styles.checkInput}
        {...rest}
      />
      <span className={styles.checkText}>
        <label htmlFor={inputId} className={styles.checkLabel}>
          {label}
        </label>
        {hint && (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}
