'use client';

import PageHeader from '@/components/layout/PageHeader';
import ButtonsSection from './ButtonsSection';
import FormControlsSection from './FormControlsSection';
import styles from './DesignSystemPage.module.css';

const SECTIONS = [
  { id: 'buttons', label: 'Buttons' },
  { id: 'form-controls', label: 'Form controls' },
];

export default function DesignSystemPage() {
  return (
    <>
      <PageHeader
        title="Design system"
        description="The tokens and components every screen is built from. Press Tab to see focus styles."
      />
      <nav aria-label="Sections" className={styles.toc}>
        <ul>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.sections}>
        <ButtonsSection />
        <FormControlsSection />
        {/* TODO(session 4): Colour, Typography, Spacing, Badges, Alerts, Cards, Empty state, Skeleton, Stat cards */}
        {/* TODO(session 5): Dialog, Toast, Stepper, Error summary, Table, Exception rules */}
      </div>
    </>
  );
}
