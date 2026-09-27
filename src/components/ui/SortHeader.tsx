import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cx } from './cx';
import styles from './Table.module.css';

export type SortDirection = 'ascending' | 'descending' | 'none';

type SortHeaderProps = { label: string; direction: SortDirection; onSort: () => void; className?: string };

const ICONS = { ascending: ChevronUp, descending: ChevronDown, none: ChevronsUpDown };

export default function SortHeader({ label, direction, onSort, className }: SortHeaderProps) {
  const Icon = ICONS[direction];
  return (
    <th scope="col" aria-sort={direction} className={className}>
      <button type="button" onClick={onSort} className={cx(styles.sortButton, direction !== 'none' && styles.sorted)}>
        {label}
        <Icon size={14} aria-hidden="true" />
      </button>
    </th>
  );
}
