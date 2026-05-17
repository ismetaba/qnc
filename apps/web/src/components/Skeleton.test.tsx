import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonRow } from './Skeleton.js';

describe('<Skeleton/>', () => {
  it('renders a span with the skeleton class + data-testid', () => {
    render(<Skeleton />);
    const el = screen.getByTestId('skeleton');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('skeleton');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('SkeletonRow renders one skeleton per column', () => {
    render(<SkeletonRow columns={5} />);
    expect(screen.getAllByTestId('skeleton').length).toBe(5);
  });
});
