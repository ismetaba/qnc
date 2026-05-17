import type { MetricByMethod, MetricSnapshot, RpcLogEntry } from '@qnc/shared';

/** Nearest-rank percentile. Returns 0 for empty arrays. p in [0,1]. */
export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const clamped = Math.min(Math.max(p, 0), 1);
  const idx = Math.min(sorted.length - 1, Math.floor(clamped * sorted.length));
  return sorted[idx]!;
}

export function computeMetrics(
  log: ReadonlyArray<RpcLogEntry>,
  endpointId: string,
  windowMs: number,
  now: number = Date.now()
): MetricSnapshot {
  const cutoff = now - windowMs;
  const slice = log.filter((e) => e.endpointId === endpointId && e.ts >= cutoff);
  const durations = slice.map((e) => e.durationMs);
  const errorCount = slice.filter((e) => !e.ok).length;

  const byMethodMap = new Map<string, MetricByMethod>();
  for (const e of slice) {
    const cur = byMethodMap.get(e.method) ?? { method: e.method, count: 0, errors: 0 };
    cur.count += 1;
    if (!e.ok) cur.errors += 1;
    byMethodMap.set(e.method, cur);
  }
  const byMethod = [...byMethodMap.values()].sort((a, b) => b.count - a.count);

  return {
    endpointId,
    windowMs,
    requestCount: slice.length,
    errorCount,
    latencyP50: percentile(durations, 0.5),
    latencyP95: percentile(durations, 0.95),
    latencyP99: percentile(durations, 0.99),
    byMethod
  };
}
