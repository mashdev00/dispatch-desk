import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './PageHeader.module.css';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
};

export default function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        {back && (
          <Link href={back.href} className={styles.back}>
            <ArrowLeft size={16} aria-hidden="true" />
            {back.label}
          </Link>
        )}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
