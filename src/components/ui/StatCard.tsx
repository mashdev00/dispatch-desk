import type { Tone } from '@/lib/types';
import { TONE_ICONS } from './toneIcons';
import { cx } from './cx';
import styles from './StatCard.module.css';

type StatCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: Tone;
  pressed?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function StatCard({ label, value, detail, tone, pressed = false, onClick, className }: StatCardProps) {
  const Icon = tone ? TONE_ICONS[tone] : null;
  const content = (
    <>
      <span className={styles.label}>
        {Icon && <Icon size={14} aria-hidden="true" className={styles.icon} />}
        {label}
      </span>
      <span className={styles.value}>{value}</span>
      {detail && <span className={styles.detail}>{detail}</span>}
    </>
  );

  const classes = cx(styles.card, tone && styles[tone], className);

  if (onClick) {
    return (
      <button type="button" aria-pressed={pressed} onClick={onClick} className={cx(classes, styles.button, pressed && styles.pressed)}>
        {content}
      </button>
    );
  }
  return <div className={classes}>{content}</div>;
}
