import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeCard } from './NodeCard.js';
import type { NodeHealth } from '@qnc/shared';

const sample: NodeHealth = {
  chain: 'eth',
  status: 'healthy',
  blockHeight: 19_500_123,
  peers: 50,
  latencyMs: 12.5,
  syncProgress: 1,
  diskGB: 1180,
  versionText: 'geth/v1.13',
  uptimeS: 3700
};

describe('<NodeCard/>', () => {
  it('renders block height and chain badge', () => {
    render(<NodeCard health={sample} />);
    expect(screen.getByTestId('node-block-height').textContent).toContain('19,500,123');
    expect(screen.getByTestId('chain-badge').textContent).toContain('ETH');
  });

  it('shows status text', () => {
    render(<NodeCard health={{ ...sample, status: 'down' }} />);
    expect(screen.getByText('down')).toBeInTheDocument();
  });
});
