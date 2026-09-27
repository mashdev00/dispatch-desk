import type { Tone } from '@/lib/types';
import { cx } from './cx';
import styles from './Badge.module.css';

type BadgeProps = { tone: Tone; icon?: React.ReactNode; children: React.ReactNode; className?: string };

export default function Badge({ tone, icon, children, className }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
