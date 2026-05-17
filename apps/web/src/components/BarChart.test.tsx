import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart } from './BarChart.js';

describe('<BarChart/>', () => {
  it('renders one rect per method', () => {
    render(
      <BarChart
        data={[
          { method: 'eth_blockNumber', count: 12, errors: 0 },
          { method: 'eth_chainId', count: 4, errors: 1 },
          { method: 'eth_gasPrice', count: 7, errors: 0 }
        ]}
      />
    );
    const bars = screen.getAllByTestId('bar-rect');
    expect(bars.length).toBe(3);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders an empty-state message when data is empty', () => {
    render(<BarChart data={[]} />);
    expect(screen.queryAllByTestId('bar-rect').length).toBe(0);
    expect(screen.getByText('no data')).toBeInTheDocument();
  });
});
