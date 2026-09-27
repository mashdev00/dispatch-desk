import { TONE_ICONS } from './toneIcons';
import { cx } from './cx';
import styles from './InlineAlert.module.css';

type InlineAlertProps = {
  tone: 'info' | 'success' | 'warning' | 'critical';
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function InlineAlert({ tone, title, children, className }: InlineAlertProps) {
  const Icon = TONE_ICONS[tone];
  return (
    <div role={tone === 'critical' ? 'alert' : 'status'} className={cx(styles.alert, styles[tone], className)}>
      <Icon size={18} aria-hidden="true" className={styles.icon} />
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
