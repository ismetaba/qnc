import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard.js';

describe('<StatCard/>', () => {
  it('renders label + value', () => {
    render(<StatCard label="REQUESTS" value="1,234" />);
    expect(screen.getByText('REQUESTS')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value').textContent).toBe('1,234');
  });

  it('renders hint when provided', () => {
    render(<StatCard label="x" value="y" hint="hello" />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies a tone attribute', () => {
    render(<StatCard label="x" value="y" tone="bad" />);
    expect(screen.getByTestId('stat-card').dataset.tone).toBe('bad');
  });
});
