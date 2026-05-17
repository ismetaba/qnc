import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tooltip } from './Tooltip.js';

describe('<Tooltip/> a11y', () => {
  it('preserves the wrapped trigger\'s aria-label', () => {
    render(
      <Tooltip label="Sends eth_blockNumber()">
        <button aria-label="open chip">chip</button>
      </Tooltip>
    );
    const trigger = screen.getByLabelText('open chip');
    expect(trigger).toBeInTheDocument();
    expect(trigger.getAttribute('aria-label')).toBe('open chip');
  });

  it('on focus reveals an element with role="tooltip" containing the label', async () => {
    render(
      <Tooltip label="fills params with []">
        <button aria-label="trigger">x</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByLabelText('trigger'));
    await waitFor(() => {
      const bubble = screen.getByRole('tooltip');
      expect(bubble.textContent).toBe('fills params with []');
    });
  });
});
