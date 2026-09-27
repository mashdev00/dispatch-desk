import { useId } from 'react';
import { cx } from './cx';
import styles from './Card.module.css';

type CardProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function Card({ title, description, actions, children, className }: CardProps) {
  const titleId = useId();
  const hasHeader = title || description || actions;
  return (
    <section className={cx(styles.card, className)} aria-labelledby={title ? titleId : undefined}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.heading}>
            {title && (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            )}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
