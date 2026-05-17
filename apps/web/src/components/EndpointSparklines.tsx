import type { Endpoint, RpcLogEntry } from '@qnc/shared';
import { Sparkline } from './Sparkline.js';
import { ChainBadge } from './ChainBadge.js';
import { formatMs } from '../lib/format.js';

const WINDOW = 30;

export interface EndpointSparklinesProps {
  logs: RpcLogEntry[];
  endpoints?: Endpoint[];
}

interface Group {
  endpointId: string;
  chain: RpcLogEntry['chain'];
  values: number[];
  lastDuration: number;
  count: number;
}

function groupLogs(logs: RpcLogEntry[]): Group[] {
  // logs are reverse-chronological from /v1/logs; normalize to chronological per endpoint, last 30.
  const buckets = new Map<string, Group>();
  // iterate from oldest to newest so values[] is chronological:
  for (let i = logs.length - 1; i >= 0; i--) {
    const e = logs[i]!;
    let g = buckets.get(e.endpointId);
    if (!g) {
      g = { endpointId: e.endpointId, chain: e.chain, values: [], lastDuration: e.durationMs, count: 0 };
      buckets.set(e.endpointId, g);
    }
    g.values.push(e.durationMs);
    g.lastDuration = e.durationMs;
    g.count += 1;
    if (g.values.length > WINDOW) g.values.shift();
  }
  return [...buckets.values()];
}

export function EndpointSparklines({ logs, endpoints = [] }: EndpointSparklinesProps): JSX.Element | null {
  const groups = groupLogs(logs);
  if (groups.length === 0) return null;

  const nameOf = (id: string) => endpoints.find((e) => e.id === id)?.name ?? id.slice(0, 8) + '…';

  return (
    <div className="card" data-testid="endpoint-sparklines" style={{ padding: 14 }}>
      <div
        className="muted"
        style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}
      >
        Latency (last {WINDOW} calls)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {groups.map((g) => (
          <div
            key={g.endpointId}
            data-testid="sparkline-row"
            data-endpoint={g.endpointId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 8px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--panel-2)'
            }}
          >
            <ChainBadge chain={g.chain} />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span className="mono" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nameOf(g.endpointId)}
              </span>
              <span className="muted" style={{ fontSize: 11 }}>
                last {formatMs(g.lastDuration)} · {g.count} calls
              </span>
            </div>
            <Sparkline values={g.values} />
          </div>
        ))}
      </div>
    </div>
  );
}
