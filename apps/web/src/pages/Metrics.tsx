import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/usePoll.js';
import { StatCard } from '../components/StatCard.js';
import { BarChart } from '../components/BarChart.js';
import { ChainBadge } from '../components/ChainBadge.js';
import { formatMs, formatNumber } from '../lib/format.js';
import type { Endpoint } from '@qnc/shared';

const WINDOWS: Array<{ label: string; ms: number }> = [
  { label: '1m', ms: 60_000 },
  { label: '5m', ms: 5 * 60_000 },
  { label: '1h', ms: 60 * 60_000 },
  { label: '24h', ms: 24 * 60 * 60_000 }
];

const POLL_MS = 3_000;

export function MetricsPage(): JSX.Element {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [endpointId, setEndpointId] = useState<string>('');
  const [windowMs, setWindowMs] = useState<number>(WINDOWS[0]!.ms);

  useEffect(() => {
    let cancelled = false;
    void api.endpoints
      .list()
      .then((eps) => {
        if (cancelled) return;
        setEndpoints(eps);
        if (eps.length && !endpointId) setEndpointId(eps[0]!.id);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMetrics = useCallback(
    () => (endpointId ? api.metrics(endpointId, windowMs) : Promise.resolve(null)),
    [endpointId, windowMs]
  );
  const { data: m, error } = usePoll(fetchMetrics, POLL_MS);

  const selected = endpoints.find((e) => e.id === endpointId);

  return (
    <div className="page">
      <header>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>Metrics</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: 13, maxWidth: 560 }}>
          Live request volume, error rate and latency percentiles for the selected endpoint. Pick a window to
          adjust the rolling aggregation.
        </p>
      </header>

      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <select
          aria-label="endpoint"
          value={endpointId}
          onChange={(e) => setEndpointId(e.target.value)}
          style={{
            background: 'var(--panel-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '6px 10px'
          }}
        >
          {endpoints.length === 0 ? <option value="">— no endpoints —</option> : null}
          {endpoints.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        {selected ? <ChainBadge chain={selected.chain} size="md" /> : null}
        <div
          className="row"
          style={{
            gap: 4,
            marginLeft: 'auto',
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: 3
          }}
        >
          {WINDOWS.map((w) => {
            const active = w.ms === windowMs;
            return (
              <button
                key={w.ms}
                type="button"
                onClick={() => setWindowMs(w.ms)}
                data-active={active}
                style={{
                  position: 'relative',
                  background: 'transparent',
                  color: active ? '#0a0d14' : 'var(--text)',
                  border: 'none',
                  borderRadius: 999,
                  padding: '4px 14px',
                  fontWeight: 600,
                  fontSize: 12,
                  zIndex: 1,
                  transition: 'color 200ms'
                }}
              >
                {active ? (
                  <motion.span
                    layoutId="metrics-window-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--accent)',
                      borderRadius: 999,
                      zIndex: -1
                    }}
                    aria-hidden="true"
                  />
                ) : null}
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <StatCard label="Requests" value={formatNumber(m?.requestCount ?? 0)} />
        <StatCard
          label="Errors"
          value={formatNumber(m?.errorCount ?? 0)}
          tone={(m?.errorCount ?? 0) > 0 ? 'bad' : 'good'}
        />
        <StatCard label="p50 latency" value={formatMs(m?.latencyP50 ?? 0)} />
        <StatCard label="p95 latency" value={formatMs(m?.latencyP95 ?? 0)} />
        <StatCard label="p99 latency" value={formatMs(m?.latencyP99 ?? 0)} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          By method
        </h2>
        <BarChart data={m?.byMethod ?? []} />
      </div>

      {error ? <div className="muted">⚠ {error.message}</div> : null}
    </div>
  );
}
