import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps): JSX.Element {
  return (
    <div className="empty-state" data-testid="empty-state">
      <span className="icon" aria-hidden="true">
        {icon ?? '∅'}
      </span>
      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{title}</div>
      {hint ? <div style={{ fontSize: 12 }}>{hint}</div> : null}
    </div>
  );
}
