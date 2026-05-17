import { useCallback, useMemo } from 'react';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/usePoll.js';
import { StatCard } from '../components/StatCard.js';
import { NodeCard } from '../components/NodeCard.js';
import { LiveLogTable } from '../components/LiveLogTable.js';
import { EndpointSparklines } from '../components/EndpointSparklines.js';
import { AnimatedNumber } from '../components/AnimatedNumber.js';
import { Skeleton } from '../components/Skeleton.js';
import { formatPct, formatMs } from '../lib/format.js';

const POLL_MS = 4_000;

export function OverviewPage(): JSX.Element {
  const fetchAll = useCallback(async () => {
    const [usage, nodes, logs, endpoints] = await Promise.all([
      api.usage(),
      api.nodes(),
      api.logs(undefined, 50),
      api.endpoints.list()
    ]);
    return { usage, nodes, logs, endpoints };
  }, []);

  const { data, loading, error } = usePoll(fetchAll, POLL_MS);

  const avgLatency = useMemo(() => {
    if (!data?.logs.length) return null;
    return data.logs.reduce((a, e) => a + e.durationMs, 0) / data.logs.length;
  }, [data?.logs]);

  // Latency series for the avg-latency stat sparkline (chronological).
  const latencySeries = useMemo(() => {
    if (!data?.logs.length) return undefined;
    return [...data.logs].reverse().map((e) => e.durationMs).slice(-30);
  }, [data?.logs]);

  // Per-chain block-height tick series (synthetic: just current heights as a 3-bar sparkline).
  const heightSeries = useMemo(() => {
    if (!data?.nodes.length) return undefined;
    return data.nodes.map((n) => n.blockHeight);
  }, [data?.nodes]);

  // Error-rate series approximated from logs (1 if !ok else 0).
  const errorSeries = useMemo(() => {
    if (!data?.logs.length) return undefined;
    return [...data.logs].reverse().map((e) => (e.ok ? 0 : 1)).slice(-30);
  }, [data?.logs]);

  const healthyCount = data?.nodes.filter((n) => n.status === 'healthy').length ?? 0;
  const isLive = (data?.logs.length ?? 0) > 0;

  const totalRequests = data?.usage.totalRequests ?? 0;

  return (
    <div className="page">
      <div className="grid-4">
        <StatCard
          label="Total requests"
          value={data ? <AnimatedNumber value={totalRequests} /> : <Skeleton width={120} height={24} />}
          hint="Since API start"
          sparkValues={errorSeries ? errorSeries.map((_, i, arr) => i + arr.length) : undefined}
        />
        <StatCard
          label="Avg latency"
          value={data ? (avgLatency === null ? '–' : formatMs(avgLatency)) : <Skeleton width={80} height={24} />}
          hint="Last 50 calls"
          tone={avgLatency !== null && avgLatency > 100 ? 'warn' : 'default'}
          sparkValues={latencySeries}
        />
        <StatCard
          label="Error rate"
          value={data ? formatPct(data.usage.errorRate) : <Skeleton width={70} height={24} />}
          tone={(data?.usage.errorRate ?? 0) > 0.01 ? 'bad' : 'good'}
          sparkValues={errorSeries}
        />
        <StatCard
          label="Healthy chains"
          value={data ? `${healthyCount}/3` : <Skeleton width={50} height={24} />}
          tone={healthyCount === 3 ? 'good' : healthyCount === 0 ? 'bad' : 'warn'}
          sparkValues={heightSeries}
        />
      </div>

      <h2>Node fleet</h2>
      <div className="grid-3">
        {data
          ? data.nodes.map((n) => <NodeCard key={n.chain} health={n} compact />)
          : Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="card">
                <Skeleton width="100%" height={80} />
              </div>
            ))}
      </div>

      <EndpointSparklines logs={data?.logs ?? []} endpoints={data?.endpoints ?? []} />

      <h2 className="row" style={{ gap: 8 }}>
        Recent traffic
        {isLive ? (
          <span
            data-testid="live-pulse"
            className="nav-dot nav-dot--green"
            aria-label="live traffic"
            style={{ marginLeft: 4 }}
          />
        ) : null}
      </h2>
      {data ? <LiveLogTable rows={data.logs} /> : (
        <div className="card">
          <Skeleton width="100%" height={120} />
        </div>
      )}

      {error ? <div className="muted">⚠ {error.message}</div> : null}
      {loading && !data ? <div className="muted">Loading…</div> : null}
    </div>
  );
}
