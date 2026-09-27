import { cx } from './cx';
import styles from './Skeleton.module.css';

type SkeletonProps = { width?: string | number; height?: string | number; className?: string };

/** A grey placeholder shown while data loads. Hidden from screen readers. */
export default function Skeleton({ width = '100%', height = '1em', className }: SkeletonProps) {
  return <span aria-hidden="true" className={cx(styles.skeleton, className)} style={{ width, height }} />;
}
