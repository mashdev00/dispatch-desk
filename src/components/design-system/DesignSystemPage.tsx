'use client';

import PageHeader from '@/components/layout/PageHeader';
import ButtonsSection from './ButtonsSection';
import FormControlsSection from './FormControlsSection';
import { ColourSection, SpacingSection, TypographySection } from './FoundationsSections';
import { AlertsSection, BadgesSection, CardsSection, LoadingSection, StatCardsSection } from './DisplaySections';
import styles from './DesignSystemPage.module.css';

const SECTIONS = [
  { id: 'colour', label: 'Colour' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'form-controls', label: 'Form controls' },
  { id: 'badges', label: 'Badges' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'cards', label: 'Cards' },
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'stat-cards', label: 'Stat cards' },
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
        <ColourSection />
        <TypographySection />
        <SpacingSection />
        <ButtonsSection />
        <FormControlsSection />
        <BadgesSection />
        <AlertsSection />
        <CardsSection />
        <LoadingSection />
        <StatCardsSection />
        {/* TODO(session 5): Dialog, Toast, Stepper, Error summary, Table, Exception rules */}
      </div>
    </>
  );
}
