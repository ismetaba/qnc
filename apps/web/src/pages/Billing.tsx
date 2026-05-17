import { useCallback } from 'react';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/usePoll.js';
import { StatCard } from '../components/StatCard.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { formatNumber } from '../lib/format.js';

const POLL_MS = 6_000;

const STATUS_TONE: Record<'paid' | 'open' | 'past_due', { color: string; label: string }> = {
  paid: { color: 'var(--green)', label: 'Paid' },
  open: { color: 'var(--accent)', label: 'Open' },
  past_due: { color: 'var(--red)', label: 'Past due' }
};

function formatUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BillingPage(): JSX.Element {
  const fetchAll = useCallback(async () => {
    const [usage, invoices] = await Promise.all([api.usage(), api.invoices()]);
    return { usage, invoices };
  }, []);
  const { data, error } = usePoll(fetchAll, POLL_MS);

  const mtd = data?.usage.monthToDate;
  const ratio = mtd && mtd.included > 0 ? mtd.requests / mtd.included : 0;

  return (
    <div className="page">
      <div className="grid-3" style={{ alignItems: 'stretch' }}>
        <StatCard
          label="Plan"
          value="Discovery"
          hint={`$49 base + $25/M overage on top of ${formatNumber(80_000_000)} included`}
        />
        <StatCard
          label="Requests this month"
          value={formatNumber(mtd?.requests ?? 0)}
          hint={`of ${formatNumber(mtd?.included ?? 80_000_000)} included`}
        />
        <StatCard
          label="Estimated cost"
          value={formatUsd(mtd?.estimatedCostUsd ?? 49)}
          tone={(mtd?.overage ?? 0) > 0 ? 'warn' : 'good'}
          hint={(mtd?.overage ?? 0) > 0 ? `${formatNumber(mtd!.overage)} requests over` : 'Within plan'}
        />
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Month-to-date usage
          </span>
          <span className="mono">
            {formatNumber(mtd?.requests ?? 0)} / {formatNumber(mtd?.included ?? 80_000_000)}
          </span>
        </div>
        <ProgressBar value={Math.min(1, ratio)} tone={ratio > 1 ? 'bad' : ratio > 0.85 ? 'warn' : 'accent'} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table data-testid="invoices-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--panel-2)' }}>
              <Th>Period</Th>
              <Th>Requests</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.invoices ?? []).map((inv) => {
              const start = new Date(inv.periodStart);
              const period = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              const status = STATUS_TONE[inv.status];
              return (
                <tr key={inv.id} data-testid="invoice-row" style={{ borderTop: '1px solid var(--border)' }}>
                  <Td>{period}</Td>
                  <Td>
                    <span className="mono">{formatNumber(inv.requests)}</span>
                  </Td>
                  <Td>
                    <span className="mono">{formatUsd(inv.amountUsd)}</span>
                  </Td>
                  <Td>
                    <span style={{ color: status.color, fontWeight: 600 }}>● {status.label}</span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error ? <div className="muted">⚠ {error.message}</div> : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '10px 14px',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: 'var(--muted)',
        fontWeight: 600
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }): JSX.Element {
  return <td style={{ padding: '10px 14px' }}>{children}</td>;
}
