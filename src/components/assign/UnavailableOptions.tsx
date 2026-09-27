import styles from './UnavailableOptions.module.css';

type Item = { id: string; name: string; reasons: string[] };

/** D9: vehicles or drivers that can't take the trip stay visible in their own collapsed group, each with its reasons. */
export default function UnavailableOptions({ items }: { items: Item[] }) {
  if (items.length === 0) return null;
  return (
    <details className={styles.group}>
      <summary>Not available ({items.length})</summary>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.reasons}>{item.reasons.join('. ')}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
