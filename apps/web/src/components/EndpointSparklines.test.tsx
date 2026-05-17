import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EndpointSparklines } from './EndpointSparklines.js';
import type { RpcLogEntry, Endpoint } from '@qnc/shared';

function makeLogs(endpointId: string, n: number): RpcLogEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    ts: 1_000_000 + i,
    endpointId,
    chain: 'eth',
    method: 'eth_blockNumber',
    durationMs: 5 + i,
    ok: true
  }));
}

describe('<EndpointSparklines/>', () => {
  it('renders one sparkline-row per unique endpoint with last 30 values', () => {
    const ep: Endpoint = { id: 'ep1', name: 'eth-prod', chain: 'eth', createdAt: '', token: 't' };
    const logs = makeLogs('ep1', 35);
    render(<EndpointSparklines logs={logs} endpoints={[ep]} />);
    const rows = screen.getAllByTestId('sparkline-row');
    expect(rows.length).toBe(1);
    const poly = screen.getByTestId('sparkline-polyline');
    const pts = (poly.getAttribute('points') ?? '').trim().split(/\s+/);
    expect(pts.length).toBe(30);
  });

  it('groups logs by endpointId', () => {
    const logs = [...makeLogs('a', 5), ...makeLogs('b', 5)];
    render(<EndpointSparklines logs={logs} />);
    const rows = screen.getAllByTestId('sparkline-row');
    expect(rows.length).toBe(2);
  });

  it('renders nothing for empty logs', () => {
    const { container } = render(<EndpointSparklines logs={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
