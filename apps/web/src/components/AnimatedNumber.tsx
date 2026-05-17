import { useEffect, useRef, useState } from 'react';

export interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
}

const DEFAULT_FORMAT = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n));

/** Tweens from previous value to target over `durationMs` (default 400). Respects reduced-motion. */
export function AnimatedNumber({ value, durationMs = 400, format = DEFAULT_FORMAT }: AnimatedNumberProps): JSX.Element {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || durationMs <= 0) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      setDisplay(v);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return <span className="tnum" data-testid="animated-number">{format(display)}</span>;
}
