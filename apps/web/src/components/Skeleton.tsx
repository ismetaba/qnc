import type { CSSProperties } from 'react';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  rounded?: boolean;
  style?: CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, rounded, style }: SkeletonProps): JSX.Element {
  return (
    <span
      data-testid="skeleton"
      aria-hidden="true"
      className="skeleton"
      style={{
        width,
        height,
        display: 'inline-block',
        borderRadius: rounded ? 999 : 6,
        ...style
      }}
    >
      &nbsp;
    </span>
  );
}

export function SkeletonRow({ columns = 4 }: { columns?: number }): JSX.Element {
  return (
    <div className="row" style={{ gap: 12 }}>
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} width={`${100 / columns}%`} height={14} />
      ))}
    </div>
  );
}
