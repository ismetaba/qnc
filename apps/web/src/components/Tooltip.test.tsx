import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tooltip } from './Tooltip.js';

describe('<Tooltip/>', () => {
  it('shows the bubble on mouse enter and hides on leave', async () => {
    render(
      <Tooltip label="Sends eth_blockNumber()">
        <button>chip</button>
      </Tooltip>
    );
    const trigger = screen.getByText('chip');
    expect(screen.queryByTestId('tooltip-bubble')).not.toBeInTheDocument();
    fireEvent.mouseEnter(trigger);
    await waitFor(() => {
      expect(screen.getByTestId('tooltip-bubble').textContent).toMatch(/Sends/);
    });
    fireEvent.mouseLeave(trigger);
    await waitFor(() => {
      expect(screen.queryByTestId('tooltip-bubble')).not.toBeInTheDocument();
    });
  });

  it('shows on focus too', async () => {
    render(
      <Tooltip label="hi">
        <button>x</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByText('x'));
    await waitFor(() => {
      expect(screen.getByTestId('tooltip-bubble')).toBeInTheDocument();
    });
  });
});
