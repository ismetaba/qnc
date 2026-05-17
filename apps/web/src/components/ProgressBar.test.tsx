import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar.js';

describe('<ProgressBar/>', () => {
  it('clamps value to [0,1] in the inline width', () => {
    const { rerender } = render(<ProgressBar value={1.5} label="x" />);
    let fill = screen.getByTestId('progress-fill');
    expect(fill.style.width).toBe('100%');

    rerender(<ProgressBar value={-0.2} label="x" />);
    fill = screen.getByTestId('progress-fill');
    expect(fill.style.width).toBe('0%');
  });

  it('renders the label percentage', () => {
    render(<ProgressBar value={0.5} label="Sync" />);
    expect(screen.getByText('Sync')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
