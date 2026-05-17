import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleProvider } from '../context/RoleContext.js';
import { ToastProvider } from '../components/Toast.js';
import { SwitchPage } from './Switch.js';
import type { User } from '@qnc/shared';

const FAKE_USERS: User[] = [
  { id: 'u1', name: 'Ada Admin', email: 'ada@x', role: 'admin' },
  { id: 'u2', name: 'Devon Dev', email: 'd@x', role: 'developer' },
  { id: 'u3', name: 'Billie Books', email: 'b@x', role: 'billing' },
  { id: 'u4', name: 'Vera Viewer', email: 'v@x', role: 'viewer' }
];

function fakeFetch() {
  return vi.fn(async () =>
    new Response(JSON.stringify(FAKE_USERS), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  ) as unknown as typeof fetch;
}

function renderSwitch(initialPath = '/switch') {
  return render(
    <RoleProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/switch" element={<SwitchPage />} />
            <Route path="/" element={<div data-testid="dashboard-stub">dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </RoleProvider>
  );
}

describe('<SwitchPage/>', () => {
  let original: typeof fetch;
  beforeEach(() => {
    original = globalThis.fetch;
    globalThis.fetch = fakeFetch();
  });
  afterEach(() => {
    globalThis.fetch = original;
  });

  it('renders 4 role cards (admin/developer/billing/viewer)', async () => {
    renderSwitch();
    const cards = await screen.findAllByTestId('role-card');
    expect(cards.length).toBe(4);
    const roles = cards.map((c) => c.dataset.role).sort();
    expect(roles).toEqual(['admin', 'billing', 'developer', 'viewer']);
  });

  it('renders the brand + subtitle', async () => {
    renderSwitch();
    expect(screen.getByText('QuickNode Clone')).toBeInTheDocument();
    expect(screen.getByText(/Pick a role to enter the console/i)).toBeInTheDocument();
  });

  it('clicking a card persists role to localStorage and navigates to /', async () => {
    renderSwitch();
    const user = userEvent.setup();
    const cards = await screen.findAllByTestId('role-card');
    const dev = cards.find((c) => c.dataset.role === 'developer')!;
    await act(async () => {
      await user.click(dev);
    });
    expect(window.localStorage.getItem('qnc.role')).toBe('developer');
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-stub')).toBeInTheDocument();
    });
  });

  it('shows the "you were here" badge on the previously-stored role', async () => {
    window.localStorage.setItem('qnc.role', 'billing');
    renderSwitch();
    const cards = await screen.findAllByTestId('role-card');
    const billing = cards.find((c) => c.dataset.role === 'billing')!;
    expect(billing.dataset.current).toBe('true');
    expect(billing.textContent).toMatch(/You were here/i);
  });

  it('every card is a real <button> with a non-empty aria-label that includes role title + user name', async () => {
    renderSwitch();
    const cards = await screen.findAllByTestId('role-card');
    for (const c of cards) {
      expect(c.tagName).toBe('BUTTON');
      const label = c.getAttribute('aria-label') ?? '';
      expect(label.length).toBeGreaterThan(0);
      // role title must always be present
      expect(label).toMatch(/Administrator|Developer|Billing|Viewer/);
    }
    // Once users load, names appear in aria-label.
    const adminCard = cards.find((c) => c.dataset.role === 'admin')!;
    expect(adminCard.getAttribute('aria-label')).toMatch(/Ada Admin/);
  });

  it('Enter on a focused card persists the role and navigates to /', async () => {
    renderSwitch();
    const user = userEvent.setup();
    const cards = await screen.findAllByTestId('role-card');
    const developer = cards.find((c) => c.dataset.role === 'developer')!;
    developer.focus();
    expect(document.activeElement).toBe(developer);
    await act(async () => {
      await user.keyboard('{Enter}');
    });
    expect(window.localStorage.getItem('qnc.role')).toBe('developer');
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-stub')).toBeInTheDocument();
    });
  });

  it('Space on a focused card also activates it', async () => {
    renderSwitch();
    const user = userEvent.setup();
    const cards = await screen.findAllByTestId('role-card');
    const viewer = cards.find((c) => c.dataset.role === 'viewer')!;
    viewer.focus();
    await act(async () => {
      await user.keyboard(' ');
    });
    expect(window.localStorage.getItem('qnc.role')).toBe('viewer');
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-stub')).toBeInTheDocument();
    });
  });
});
