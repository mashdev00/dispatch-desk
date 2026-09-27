import Section, { Sample } from './Section';
import {
  COLOR_TOKENS,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  SPACE_TOKENS,
  TONE_TOKENS,
  TYPE_TOKENS,
  contrastRatio,
} from './tokens';
import styles from './DesignSystemPage.module.css';

const WHITE = '#FFFFFF';

export function ColourSection() {
  return (
    <Section
      id="colour"
      title="Colour"
      description="Every text colour passes WCAG 2.2 AA: 4.5:1 for text, 3:1 for input borders and the focus ring. Colour never carries meaning alone; badges and alerts always add an icon and a word."
    >
      <Sample label="Tokens" wide>
        <ul className={styles.swatches}>
          {COLOR_TOKENS.map((token) => (
            <li key={token.name} className={styles.swatch}>
              <span className={styles.swatchColour} style={{ background: `var(${token.name})` }} aria-hidden="true" />
              <span className={styles.swatchText}>
                <code>{token.name}</code>
                <span className={styles.meta}>
                  {token.value} · {token.use}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Sample>
      <Sample label="Brand contrast" wide>
        <ul className={styles.contrastList}>
          <li>
            <span className={styles.contrastChip} style={{ background: 'var(--color-brand)', color: 'var(--color-surface)' }}>
              White on brand
            </span>
            <span className={styles.meta}>{contrastRatio(WHITE, '#1D5FD1')}</span>
          </li>
          <li>
            <span className={styles.contrastChip} style={{ background: 'var(--color-surface)', color: 'var(--color-brand)' }}>
              Brand on white
            </span>
            <span className={styles.meta}>{contrastRatio('#1D5FD1', WHITE)}</span>
          </li>
          <li>
            <span className={styles.contrastChip} style={{ background: 'var(--color-danger)', color: 'var(--color-surface)' }}>
              White on danger
            </span>
            <span className={styles.meta}>{contrastRatio(WHITE, '#C62828')}</span>
          </li>
          <li>
            <span className={styles.contrastChip} style={{ background: 'var(--color-surface)', color: 'var(--color-text-subtle)' }}>
              Subtle text on white
            </span>
            <span className={styles.meta}>{contrastRatio('#5F6B7D', WHITE)}</span>
          </li>
        </ul>
      </Sample>
      <Sample label="Tones: text on background" wide>
        <ul className={styles.tones}>
          {TONE_TOKENS.map((tone) => (
            <li
              key={tone.tone}
              className={styles.tone}
              style={{
                background: `var(--tone-${tone.tone}-bg)`,
                color: `var(--tone-${tone.tone}-fg)`,
                borderColor: `var(--tone-${tone.tone}-border)`,
              }}
            >
              <strong>{tone.tone[0].toUpperCase() + tone.tone.slice(1)}</strong>
              <span>{tone.use}</span>
              <span className={styles.toneRatio}>{contrastRatio(tone.fg, tone.bg)}</span>
            </li>
          ))}
        </ul>
      </Sample>
    </Section>
  );
}

export function TypographySection() {
  return (
    <Section id="typography" title="Typography" description="Inter, with tabular figures in tables, times, IDs and KPIs so numbers line up.">
      <Sample label="Type scale" wide>
        <ul className={styles.typeList}>
          {TYPE_TOKENS.map((token) => (
            <li key={token.name} className={styles.typeRow}>
              <span style={{ fontSize: `var(${token.name})` }} className={styles.typeSample}>
                Trip TRP-24121 · Lahore → Karachi
              </span>
              <span className={styles.meta}>
                <code>{token.name}</code> · {token.px}px · {token.use}
              </span>
            </li>
          ))}
        </ul>
      </Sample>
      <Sample label="Weights">
        <p style={{ fontWeight: 'var(--weight-regular)' }}>Regular 400 · body text</p>
        <p style={{ fontWeight: 'var(--weight-medium)' }}>Medium 500 · labels, buttons</p>
        <p style={{ fontWeight: 'var(--weight-semibold)' }}>Semibold 600 · headings</p>
      </Sample>
    </Section>
  );
}

export function SpacingSection() {
  return (
    <Section id="spacing" title="Spacing, radius and shadow" description="A 4px grid. Components never use raw pixel values.">
      <Sample label="Space">
        <ul className={styles.spaceList}>
          {SPACE_TOKENS.map((token) => (
            <li key={token.name} className={styles.spaceRow}>
              <span className={styles.spaceBar} style={{ width: `var(${token.name})` }} aria-hidden="true" />
              <span className={styles.meta}>
                <code>{token.name}</code> · {token.px}px
              </span>
            </li>
          ))}
        </ul>
      </Sample>
      <Sample label="Radius">
        <ul className={styles.shapeList}>
          {RADIUS_TOKENS.map((token) => (
            <li key={token.name} className={styles.shapeItem}>
              <span className={styles.shapeBox} style={{ borderRadius: `var(${token.name})` }} aria-hidden="true" />
              <span className={styles.meta}>
                <code>{token.name}</code> · {token.value}
              </span>
            </li>
          ))}
        </ul>
      </Sample>
      <Sample label="Shadow">
        <ul className={styles.shapeList}>
          {SHADOW_TOKENS.map((name) => (
            <li key={name} className={styles.shapeItem}>
              <span className={styles.shadowBox} style={{ boxShadow: `var(${name})` }} aria-hidden="true" />
              <span className={styles.meta}>
                <code>{name}</code>
              </span>
            </li>
          ))}
        </ul>
      </Sample>
    </Section>
  );
}
