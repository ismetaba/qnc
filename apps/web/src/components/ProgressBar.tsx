export interface ProgressBarProps {
  value: number; // 0..1
  label?: string;
  height?: number;
  tone?: 'accent' | 'good' | 'warn' | 'bad';
}

const TONE_COLOR: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  accent: 'var(--accent)',
  good: 'var(--green)',
  warn: 'var(--amber)',
  bad: 'var(--red)'
};

export function ProgressBar({ value, label, height = 8, tone = 'accent' }: ProgressBarProps): JSX.Element {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 1000) / 10;
  return (
    <div data-testid="progress-bar">
      {label ? (
        <div
          className="muted"
          style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}
        >
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      ) : null}
      <div
        style={{
          background: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          height,
          overflow: 'hidden'
        }}
      >
        <div
          data-testid="progress-fill"
          style={{
            width: `${pct}%`,
            height: '100%',
            background: TONE_COLOR[tone],
            transition: 'width 220ms ease'
          }}
        />
      </div>
    </div>
  );
}
