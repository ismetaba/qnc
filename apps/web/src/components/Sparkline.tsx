import { useEffect, useRef, useState } from 'react';

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  /** When false, skip the draw-in animation. */
  animate?: boolean;
}

/**
 * Tiny inline sparkline. Renders a single <polyline> with one point per value.
 * Empty values render the svg frame only.
 * On first render the line draws itself in via stroke-dashoffset (≈700ms),
 * unless prefers-reduced-motion or animate=false.
 */
export function Sparkline({
  values,
  width = 80,
  height = 20,
  color = 'var(--accent)',
  animate = true
}: SparklineProps): JSX.Element {
  const polyRef = useRef<SVGPolylineElement>(null);
  const [length, setLength] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (!polyRef.current) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduce) {
      setDrawn(true);
      return;
    }
    const len = polyRef.current.getTotalLength?.() ?? 0;
    setLength(len);
    // Trigger the dashoffset transition next frame.
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, [values, animate]);

  if (values.length === 0) {
    return (
      <svg
        data-testid="sparkline"
        role="img"
        aria-label="latency sparkline (no data)"
        width={width}
        height={height}
      />
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const dashStyle: React.CSSProperties =
    length === null
      ? {}
      : {
          strokeDasharray: length,
          strokeDashoffset: drawn ? 0 : length,
          transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 0.61, 0.36, 1)'
        };

  return (
    <svg
      data-testid="sparkline"
      role="img"
      aria-label="latency sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
    >
      <polyline
        ref={polyRef}
        data-testid="sparkline-polyline"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        style={dashStyle}
      />
    </svg>
  );
}
