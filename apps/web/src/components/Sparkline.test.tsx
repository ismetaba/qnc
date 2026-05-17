import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline } from './Sparkline.js';

describe('<Sparkline/>', () => {
  it('renders a polyline with N comma-separated point pairs for 30 values', () => {
    const values = Array.from({ length: 30 }, (_, i) => i + 1);
    render(<Sparkline values={values} />);
    const poly = screen.getByTestId('sparkline-polyline');
    const pts = (poly.getAttribute('points') ?? '').trim().split(/\s+/);
    expect(pts.length).toBe(30);
    for (const p of pts) {
      expect(p).toMatch(/^\d+(\.\d+)?,\d+(\.\d+)?$/);
    }
  });

  it('renders no polyline for empty input', () => {
    render(<Sparkline values={[]} />);
    expect(screen.queryByTestId('sparkline-polyline')).not.toBeInTheDocument();
    expect(screen.getByTestId('sparkline')).toBeInTheDocument();
  });

  it('handles a flat series without dividing by zero', () => {
    render(<Sparkline values={[5, 5, 5, 5]} />);
    const poly = screen.getByTestId('sparkline-polyline');
    const pts = (poly.getAttribute('points') ?? '').trim().split(/\s+/);
    expect(pts.length).toBe(4);
    for (const p of pts) expect(p).not.toContain('NaN');
  });
});
