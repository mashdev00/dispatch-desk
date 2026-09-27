import { LoaderCircle } from 'lucide-react';
import { cx } from './cx';
import styles from './Button.module.css';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  loading?: boolean;
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(styles.button, styles[variant], styles[size], className)}
      {...rest}
    >
      {loading ? (
        <LoaderCircle size={16} aria-hidden="true" className={styles.spinner} />
      ) : (
        icon && <span className={styles.icon}>{icon}</span>
      )}
      {children}
    </button>
  );
}
