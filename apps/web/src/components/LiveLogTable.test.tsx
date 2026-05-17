import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveLogTable } from './LiveLogTable.js';
import type { RpcLogEntry } from '@qnc/shared';

describe('<LiveLogTable/>', () => {
  it('renders one row per log entry', () => {
    const rows: RpcLogEntry[] = [
      { ts: Date.now(), endpointId: 'aaaa1111', chain: 'eth', method: 'eth_blockNumber', durationMs: 5, ok: true },
      { ts: Date.now(), endpointId: 'bbbb2222', chain: 'btc', method: 'getblockcount', durationMs: 12, ok: false, error: 'x' }
    ];
    render(<LiveLogTable rows={rows} />);
    expect(screen.getAllByTestId('log-row').length).toBe(2);
    expect(screen.getByText('eth_blockNumber')).toBeInTheDocument();
    expect(screen.getByText('getblockcount')).toBeInTheDocument();
  });

  it('renders empty-state component when no rows', () => {
    render(<LiveLogTable rows={[]} />);
    expect(screen.queryByTestId('log-table')).not.toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No traffic yet')).toBeInTheDocument();
  });
});
