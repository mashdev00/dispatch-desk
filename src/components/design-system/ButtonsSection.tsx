'use client';

import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import Section, { Sample } from './Section';
import styles from './DesignSystemPage.module.css';

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;

export default function ButtonsSection() {
  return (
    <Section
      id="buttons"
      title="Buttons"
      description="One primary action per area. Secondary for everything else, ghost for low-emphasis actions, danger only for actions that destroy something."
    >
      {VARIANTS.map((variant) => (
        <Sample key={variant} label={variant[0].toUpperCase() + variant.slice(1)}>
          <div className={styles.row}>
            <Button variant={variant}>Save</Button>
            <Button variant={variant} icon={variant === 'danger' ? <Trash2 /> : <Plus />}>
              {variant === 'danger' ? 'Delete' : 'Add stop'}
            </Button>
            <Button variant={variant} size="sm">
              Small
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} loading>
              Saving
            </Button>
          </div>
        </Sample>
      ))}
      <Sample label="Link styled as a button">
        <div className={styles.row}>
          <ButtonLink href="/trips/new" variant="primary" icon={<Plus />}>
            New trip
          </ButtonLink>
          <ButtonLink href="/trips">All trips</ButtonLink>
        </div>
      </Sample>
    </Section>
  );
}
