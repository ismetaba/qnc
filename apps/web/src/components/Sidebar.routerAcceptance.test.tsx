import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleProvider, useRole } from '../context/RoleContext.js';
import { Sidebar } from './Sidebar.js';
import type { Role } from '@qnc/shared';

function Switcher({ to }: { to: Role }): JSX.Element {
  const { setRole } = useRole();
  return <button onClick={() => setRole(to)}>switch:{to}</button>;
}

describe('Sidebar role-switch acceptance criterion #1', () => {
  it('billing role hides Endpoints/RPC/Nodes/Users/Settings; admin restores all 8', () => {
    window.localStorage.setItem('qnc.role', 'admin');
    render(
      <RoleProvider>
        <MemoryRouter>
          <Sidebar />
          <Switcher to="billing" />
          <Switcher to="admin" />
        </MemoryRouter>
      </RoleProvider>
    );

    let items = screen.getAllByRole('link').map((a) => a.getAttribute('data-nav'));
    expect(items.length).toBe(8);

    act(() => {
      screen.getByText('switch:billing').click();
    });
    items = screen.getAllByRole('link').map((a) => a.getAttribute('data-nav'));
    expect(items).not.toContain('endpoints');
    expect(items).not.toContain('rpc');
    expect(items).not.toContain('nodes');
    expect(items).not.toContain('users');
    expect(items).not.toContain('settings');
    expect(items).toEqual(['overview', 'billing']);

    act(() => {
      screen.getByText('switch:admin').click();
    });
    items = screen.getAllByRole('link').map((a) => a.getAttribute('data-nav'));
    expect(items.length).toBe(8);
    for (const nav of ['overview', 'endpoints', 'rpc', 'metrics', 'nodes', 'users', 'billing', 'settings']) {
      expect(items).toContain(nav);
    }
  });
});
