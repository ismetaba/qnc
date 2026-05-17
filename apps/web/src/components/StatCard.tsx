import type { ReactNode } from 'react';
import { Sparkline } from './Sparkline.js';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  /** Optional series of numbers rendered as a faint sparkline behind the value. */
  sparkValues?: number[];
}

const TONE_COLOR: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'var(--text)',
  good: 'var(--green)',
  warn: 'var(--amber)',
  bad: 'var(--red)'
};

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  sparkValues
}: StatCardProps): JSX.Element {
  return (
    <div className="card interactive" data-testid="stat-card" data-tone={tone} style={{ position: 'relative', overflow: 'hidden' }}>
      {sparkValues && sparkValues.length > 1 ? (
        <div
          aria-hidden="true"
          data-testid="stat-spark"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.18,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 6px 0 6px'
          }}
        >
          <Sparkline
            values={sparkValues}
            width={260}
            height={56}
            color={TONE_COLOR[tone]}
            animate
          />
        </div>
      ) : null}
      <div style={{ position: 'relative' }}>
        <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.08 + 'em' }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            marginTop: 6,
            color: TONE_COLOR[tone],
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em'
          }}
          data-testid="stat-value"
        >
          {value}
        </div>
        {hint ? (
          <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}
