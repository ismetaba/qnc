import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState.js';

describe('<EmptyState/>', () => {
  it('renders an icon, a title, and an optional hint', () => {
    render(<EmptyState icon="✦" title="Nothing here" hint="Add one to get started" />);
    const el = screen.getByTestId('empty-state');
    expect(el.textContent).toContain('Nothing here');
    expect(el.textContent).toContain('Add one to get started');
    expect(el.textContent).toContain('✦');
  });

  it('hint is optional', () => {
    render(<EmptyState title="empty" />);
    expect(screen.getByTestId('empty-state').textContent).toContain('empty');
  });
});
