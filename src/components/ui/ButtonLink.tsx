import Link from 'next/link';
import { cx } from './cx';
import type { ButtonProps } from './Button';
import styles from './Button.module.css';

type ButtonLinkProps = {
  href: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function ButtonLink({ href, variant = 'secondary', size = 'md', icon, children, className }: ButtonLinkProps) {
  return (
    <Link href={href} className={cx(styles.button, styles[variant], styles[size], className)}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </Link>
  );
}
