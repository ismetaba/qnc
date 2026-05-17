import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleProvider } from '../../context/RoleContext.js';
import { Sidebar } from '../../components/Sidebar.js';

describe('US-5 — billing role sidebar exact contents', () => {
  it("contains exactly 'Overview' + 'Billing' and none of Endpoints / RPC / Nodes / Users / Settings", () => {
    window.localStorage.setItem('qnc.role', 'billing');
    render(
      <RoleProvider>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </RoleProvider>
    );
    const navs = screen.getAllByRole('link').map((a) => a.getAttribute('data-nav'));
    expect(navs).toEqual(['overview', 'billing']);

    // Visible labels
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();

    // Forbidden labels
    for (const forbidden of ['Endpoints', 'RPC Playground', 'Nodes', 'Users', 'Settings']) {
      expect(screen.queryByText(forbidden), `should not show ${forbidden}`).not.toBeInTheDocument();
    }
  });
});
