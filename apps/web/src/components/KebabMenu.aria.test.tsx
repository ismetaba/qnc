import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KebabMenu } from './KebabMenu.js';

describe('<KebabMenu/> a11y', () => {
  it('trigger has a default non-empty aria-label "row actions"', () => {
    render(<KebabMenu items={[{ key: 'd', label: 'Delete', onSelect: () => undefined }]} />);
    const trigger = screen.getByTestId('kebab-trigger');
    const label = trigger.getAttribute('aria-label') ?? '';
    expect(label.length).toBeGreaterThan(0);
    expect(label).toBe('row actions');
  });

  it('trigger uses an explicit aria-label when provided', () => {
    render(
      <KebabMenu
        ariaLabel="actions for eth-mainnet-prod"
        items={[{ key: 'd', label: 'Delete', onSelect: () => undefined }]}
      />
    );
    expect(screen.getByTestId('kebab-trigger').getAttribute('aria-label')).toBe(
      'actions for eth-mainnet-prod'
    );
  });

  it('open menu has role="menu" and items have visible labels + role="menuitem"', async () => {
    render(<KebabMenu items={[{ key: 'd', label: 'Delete', onSelect: () => undefined }]} />);
    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByTestId('kebab-trigger'));
    });
    const menu = screen.getByTestId('kebab-menu-list');
    expect(menu.getAttribute('role')).toBe('menu');
    const item = screen.getByTestId('kebab-item');
    expect(item.getAttribute('role')).toBe('menuitem');
    expect(item.textContent).toBe('Delete');
  });

  it('trigger advertises aria-haspopup and aria-expanded that toggles', async () => {
    render(<KebabMenu items={[{ key: 'd', label: 'Delete', onSelect: () => undefined }]} />);
    const user = userEvent.setup();
    const trigger = screen.getByTestId('kebab-trigger');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await act(async () => {
      await user.click(trigger);
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});
