import type { RpcLogEntry } from '@qnc/shared';
import { ChainBadge } from './ChainBadge.js';
import { EmptyState } from './EmptyState.js';
import { formatMs, formatRelativeTime } from '../lib/format.js';

export interface LiveLogTableProps {
  rows: RpcLogEntry[];
  emptyMessage?: string;
  showEndpoint?: boolean;
}

export function LiveLogTable({
  rows,
  emptyMessage = 'No traffic in this window — try the Playground.',
  showEndpoint = true
}: LiveLogTableProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <div className="card">
        <EmptyState icon="⌁" title="No traffic yet" hint={emptyMessage} />
      </div>
    );
  }
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="data-table" data-testid="log-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Chain</th>
            <th>Method</th>
            <th>Latency</th>
            <th>Status</th>
            {showEndpoint ? <th>Endpoint</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.ts}-${i}`} data-testid="log-row">
              <td>
                <span className="muted">{formatRelativeTime(r.ts)}</span>
              </td>
              <td>
                <ChainBadge chain={r.chain} />
              </td>
              <td>
                <span className="mono">{r.method}</span>
              </td>
              <td>
                <span className="mono tnum">{formatMs(r.durationMs)}</span>
              </td>
              <td>
                {r.ok ? (
                  <span style={{ color: 'var(--green)' }}>● ok</span>
                ) : (
                  <span style={{ color: 'var(--red)' }} title={r.error ?? 'error'}>
                    ● err
                  </span>
                )}
              </td>
              {showEndpoint ? (
                <td>
                  <span className="mono muted" style={{ fontSize: 12 }}>
                    {r.endpointId.slice(0, 8)}…
                  </span>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
