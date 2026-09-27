import { Check } from 'lucide-react';
import { cx } from './cx';
import styles from './Stepper.module.css';

type StepperProps = {
  steps: { label: string }[];
  current: number;
  maxReached: number;
  onStepClick?: (index: number) => void;
  className?: string;
};

export default function Stepper({ steps, current, maxReached, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cx(styles.stepper, className)}>
      <p className={styles.summary}>
        Step {current + 1} of {steps.length}: {steps[current]?.label}
      </p>
      <ol className={styles.list}>
        {steps.map((step, index) => {
          // A step is finished once the user has moved past it, even after jumping back to an earlier step.
          const done = index < maxReached && index !== current;
          const isCurrent = index === current;
          const reachable = onStepClick && index <= maxReached && !isCurrent;
          const state = isCurrent ? 'current' : done ? 'done' : 'upcoming';
          const marker = (
            <>
              <span className={styles.marker} aria-hidden="true">
                {done ? <Check size={14} /> : index + 1}
              </span>
              <span className={styles.label}>
                {step.label}
                {done && <span className="visually-hidden"> (completed)</span>}
              </span>
            </>
          );
          return (
            <li key={step.label} className={cx(styles.step, styles[state])} aria-current={isCurrent ? 'step' : undefined}>
              {reachable ? (
                <button type="button" className={styles.stepButton} onClick={() => onStepClick(index)}>
                  {marker}
                </button>
              ) : (
                <span className={styles.stepStatic}>{marker}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
