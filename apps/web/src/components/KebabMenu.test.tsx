import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KebabMenu } from './KebabMenu.js';

describe('<KebabMenu/>', () => {
  it('opens on trigger click and renders the items', async () => {
    const onSelect = vi.fn();
    render(<KebabMenu items={[{ key: 'd', label: 'Delete', tone: 'danger', onSelect }]} />);
    const user = userEvent.setup();
    expect(screen.queryByTestId('kebab-menu-list')).not.toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByTestId('kebab-trigger'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('kebab-menu-list')).toBeInTheDocument();
    });
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('invokes onSelect and closes on item click', async () => {
    const onSelect = vi.fn();
    render(<KebabMenu items={[{ key: 'a', label: 'Archive', onSelect }]} />);
    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByTestId('kebab-trigger'));
    });
    await act(async () => {
      await user.click(screen.getByText('Archive'));
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByTestId('kebab-menu-list')).not.toBeInTheDocument();
    });
  });
});
