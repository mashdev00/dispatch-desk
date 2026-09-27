import { useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cx } from './cx';
import styles from './Field.module.css';

type RadioGroupProps = {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string; disabled?: boolean }[];
  hint?: string;
  error?: string;
  className?: string;
  /** Id for the first radio, so an error summary link can focus the group. */
  id?: string;
};

export default function RadioGroup({ legend, name, value, onChange, options, hint, error, className, id }: RadioGroupProps) {
  const baseId = useId();
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      className={cx(styles.fieldset, error && styles.fieldsetInvalid, className)}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
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
      <div className={styles.options}>
        {options.map((option, index) => {
          const optionId = index === 0 && id ? id : `${baseId}-${index}`;
          const descriptionId = `${optionId}-description`;
          return (
            <div key={option.value} className={styles.check}>
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                aria-describedby={option.description ? descriptionId : undefined}
                className={styles.checkInput}
              />
              <span className={styles.checkText}>
                <label htmlFor={optionId} className={styles.checkLabel}>
                  {option.label}
                </label>
                {option.description && (
                  <span id={descriptionId} className={styles.hint}>
                    {option.description}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
