import type { MetricByMethod } from '@qnc/shared';
import { motion } from 'framer-motion';

export interface BarChartProps {
  data: MetricByMethod[];
  height?: number;
}

export function BarChart({ data, height = 220 }: BarChartProps): JSX.Element {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barWidth = 36;
  const gap = 14;
  const left = 60;
  const bottom = 40;
  const innerH = height - bottom - 16;
  const width = Math.max(360, left + (barWidth + gap) * data.length + 20);

  return (
    <svg
      data-testid="bar-chart"
      role="img"
      aria-label="requests by method"
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ background: 'var(--panel-2)', borderRadius: 8, border: '1px solid var(--border)' }}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((p) => {
        const y = 16 + innerH * (1 - p);
        return (
          <g key={p}>
            <line x1={left} x2={width - 12} y1={y} y2={y} stroke="var(--border)" />
            <text x={left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
              {Math.round(max * p)}
            </text>
          </g>
        );
      })}
      {data.length === 0 ? (
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="var(--muted)" fontSize="12">
          no data
        </text>
      ) : null}
      {data.map((d, i) => {
        const h = innerH * (d.count / max);
        const x = left + i * (barWidth + gap);
        const y = 16 + (innerH - h);
        const errorH = innerH * (d.errors / max);
        return (
          <g key={d.method} data-method={d.method}>
            <motion.rect
              data-testid="bar-rect"
              x={x}
              width={barWidth}
              fill="var(--accent)"
              rx="3"
              initial={{ y: 16 + innerH, height: 0 }}
              animate={{ y, height: Math.max(2, h) }}
              transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1], delay: i * 0.03 }}
            />
            {d.errors > 0 ? (
              <motion.rect
                x={x}
                width={barWidth}
                fill="var(--red)"
                opacity={0.7}
                rx="3"
                initial={{ y: 16 + innerH, height: 0 }}
                animate={{ y: 16 + innerH - errorH, height: Math.max(2, errorH) }}
                transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1], delay: i * 0.03 + 0.05 }}
              />
            ) : null}
            <text
              x={x + barWidth / 2}
              y={height - 22}
              textAnchor="middle"
              fontSize="10"
              fill="var(--muted)"
              transform={`rotate(-30 ${x + barWidth / 2} ${height - 22})`}
            >
              {d.method}
            </text>
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text)"
            >
              {d.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
