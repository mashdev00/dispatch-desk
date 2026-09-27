import styles from './DesignSystemPage.module.css';

type SectionProps = { id: string; title: string; description?: string; children: React.ReactNode };

/** One titled block on the design system page. */
export default function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={styles.section}>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        {title}
      </h2>
      {description && <p className={styles.sectionDescription}>{description}</p>}
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

/** A labelled sample inside a section. */
export function Sample({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? styles.sampleWide : styles.sample}>
      <h3 className={styles.sampleLabel}>{label}</h3>
      <div className={styles.sampleBody}>{children}</div>
    </div>
  );
}
