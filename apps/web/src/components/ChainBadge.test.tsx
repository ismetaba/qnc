import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChainBadge } from './ChainBadge.js';

describe('<ChainBadge/>', () => {
  it.each(['eth', 'avax', 'btc'] as const)('renders %s with the right label', (chain) => {
    render(<ChainBadge chain={chain} />);
    const badge = screen.getByTestId('chain-badge');
    expect(badge.dataset.chain).toBe(chain);
    expect(badge.textContent).toContain(chain.toUpperCase());
  });
});
