import { cx } from './cx';
import styles from './EmptyState.module.css';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Use 'h1' when the empty state is the whole page, e.g. "Trip not found". */
  titleAs?: 'p' | 'h1' | 'h2';
};

export default function EmptyState({ icon, title, description, action, className, titleAs: Title = 'p' }: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, className)}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <Title className={styles.title}>{title}</Title>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
