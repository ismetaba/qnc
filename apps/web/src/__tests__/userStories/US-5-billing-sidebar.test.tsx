/**
 * Spec User Story #5:
 *   "As a billing user, I want a Billing page... — and I should NOT see Endpoints,
 *   RPC, Nodes, or Users in the sidebar."
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleProvider } from '../../context/RoleContext.js';
import { Sidebar } from '../../components/Sidebar.js';

describe('US-5: billing role sees a narrow sidebar', () => {
  it('renders exactly Overview + Billing labels', () => {
    window.localStorage.setItem('qnc.role', 'billing');
    render(
      <RoleProvider>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </RoleProvider>
    );

    const links = screen.getAllByRole('link');
    const navs = links.map((l) => l.getAttribute('data-nav'));
    expect(navs).toEqual(['overview', 'billing']);

    const labels = links.map((l) => l.textContent?.trim());
    expect(labels).toEqual(['Overview', 'Billing']);

    // Negative assertions for the spec's exact list.
    for (const forbidden of ['Endpoints', 'RPC Playground', 'Metrics', 'Nodes', 'Users', 'Settings']) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
  });
});
