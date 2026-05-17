import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleProvider, useRole } from '../context/RoleContext.js';
import { Sidebar } from './Sidebar.js';

function RoleSwitch({ to }: { to: 'admin' | 'developer' | 'billing' | 'viewer' }): JSX.Element {
  const { setRole } = useRole();
  return <button onClick={() => setRole(to)}>switch:{to}</button>;
}

function renderWithRouter(initialRole: 'admin' | 'developer' | 'billing' | 'viewer') {
  window.localStorage.setItem('qnc.role', initialRole);
  return render(
    <RoleProvider>
      <MemoryRouter>
        <Sidebar />
        <RoleSwitch to="billing" />
        <RoleSwitch to="admin" />
      </MemoryRouter>
    </RoleProvider>
  );
}

describe('<Sidebar/>', () => {
  it('renders all 8 nav items for admin', () => {
    renderWithRouter('admin');
    const items = screen.getAllByRole('link').map((a) => a.getAttribute('data-nav'));
    expect(items).toEqual(['overview', 'endpoints', 'rpc', 'metrics', 'nodes', 'users', 'billing', 'settings']);
  });

  it('renders only overview + billing for the billing role', () => {
    renderWithRouter('billing');
    const items = screen.getAllByRole('link').map((a) => a.getAttribute('data-nav'));
    expect(items).toEqual(['overview', 'billing']);
  });

  it('renders only overview, metrics, nodes for the viewer role', () => {
    renderWithRouter('viewer');
    const items = screen.getAllByRole('link').map((a) => a.getAttribute('data-nav'));
    expect(items).toEqual(['overview', 'metrics', 'nodes']);
  });

  it('switching role re-renders the sidebar nav', () => {
    renderWithRouter('admin');
    act(() => {
      screen.getByText('switch:billing').click();
    });
    let items = screen.getAllByRole('link').map((a) => a.getAttribute('data-nav'));
    expect(items).toEqual(['overview', 'billing']);
    act(() => {
      screen.getByText('switch:admin').click();
    });
    items = screen.getAllByRole('link').map((a) => a.getAttribute('data-nav'));
    expect(items.length).toBe(8);
  });
});
