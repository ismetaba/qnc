import { useCallback, useMemo } from 'react';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/usePoll.js';
import { NodeCard } from '../components/NodeCard.js';
import { StatCard } from '../components/StatCard.js';
import { Skeleton } from '../components/Skeleton.js';
import { EmptyState } from '../components/EmptyState.js';
import { formatMs, formatNumber, formatGB } from '../lib/format.js';
import type { NodeHealth, NodeStatus } from '@qnc/shared';

const POLL_MS = 2_500;

const STATUS_ORDER: Record<NodeStatus, number> = { down: 0, lagging: 1, healthy: 2 };

export function NodesPage(): JSX.Element {
  const fetchNodes = useCallback(() => api.nodes(), []);
  const { data, error, loading } = usePoll(fetchNodes, POLL_MS);

  const sorted = useMemo<NodeHealth[]>(() => {
    if (!data) return [];
    return [...data].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [data]);

  const summary = useMemo(() => {
    const nodes = data ?? [];
    const healthy = nodes.filter((n) => n.status === 'healthy').length;
    const lagging = nodes.filter((n) => n.status === 'lagging').length;
    const down = nodes.filter((n) => n.status === 'down').length;
    const totalPeers = nodes.reduce((s, n) => s + n.peers, 0);
    const totalDisk = nodes.reduce((s, n) => s + n.diskGB, 0);
    const avgLatency = nodes.length ? Math.round(nodes.reduce((s, n) => s + n.latencyMs, 0) / nodes.length) : 0;
    return { total: nodes.length, healthy, lagging, down, totalPeers, totalDisk, avgLatency };
  }, [data]);

  return (
    <div className="page">
      <PageHeader
        title="Node fleet"
        description="Three mock blockchain full-nodes powering every RPC endpoint. Health refreshes every 2.5 s."
        status={
          summary.total === 0
            ? null
            : summary.down > 0
              ? { tone: 'bad', label: `${summary.down} down` }
              : summary.lagging > 0
                ? { tone: 'warn', label: `${summary.lagging} lagging` }
                : { tone: 'good', label: 'All systems nominal' }
        }
      />

      <div className="grid-4">
        <StatCard label="Nodes online" value={`${summary.healthy} / ${summary.total || '—'}`} tone={summary.down > 0 ? 'bad' : 'good'} />
        <StatCard label="Total peers" value={formatNumber(summary.totalPeers)} />
        <StatCard label="Avg latency" value={formatMs(summary.avgLatency)} tone={summary.avgLatency > 200 ? 'warn' : 'good'} />
        <StatCard label="Disk in use" value={formatGB(summary.totalDisk)} />
      </div>

      {error ? (
        <div className="card" role="alert" style={{ borderColor: 'var(--red)' }}>
          <strong style={{ color: 'var(--red)' }}>Could not reach the node fleet.</strong>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>{error.message}</div>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="grid-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={220} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No nodes reporting"
          hint="The mock chains haven't checked in yet. Make sure node-eth, node-avax and node-btc are running."
        />
      ) : (
        <div className="grid-3">
          {sorted.map((n) => (
            <NodeCard key={n.chain} health={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function PageHeader({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: { tone: 'good' | 'warn' | 'bad'; label: string } | null;
}): JSX.Element {
  const toneColor = status?.tone === 'bad' ? 'var(--red)' : status?.tone === 'warn' ? 'var(--amber)' : 'var(--green)';
  return (
    <header className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>{title}</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: 13, maxWidth: 560 }}>{description}</p>
      </div>
      {status ? (
        <div
          className="row"
          style={{
            gap: 8,
            padding: '6px 12px',
            borderRadius: 999,
            border: `1px solid color-mix(in srgb, ${toneColor} 40%, var(--border))`,
            background: `color-mix(in srgb, ${toneColor} 12%, transparent)`,
            color: toneColor,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: toneColor, boxShadow: `0 0 8px ${toneColor}` }} />
          {status.label}
        </div>
      ) : null}
    </header>
  );
}
