import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UsersPage } from './Users.js';

const FAKE_USERS = [
  { id: 'u1', name: 'Ada Admin', email: 'ada@x', role: 'admin' as const },
  { id: 'u2', name: 'Devon Dev', email: 'd@x', role: 'developer' as const },
  { id: 'u3', name: 'Billie Books', email: 'b@x', role: 'billing' as const },
  { id: 'u4', name: 'Vera Viewer', email: 'v@x', role: 'viewer' as const }
];

function fakeFetch() {
  return vi.fn(async () =>
    new Response(JSON.stringify(FAKE_USERS), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  ) as unknown as typeof fetch;
}

describe('<UsersPage/>', () => {
  let original: typeof fetch;
  beforeEach(() => {
    original = globalThis.fetch;
    globalThis.fetch = fakeFetch();
  });
  afterEach(() => {
    globalThis.fetch = original;
  });

  it('renders one row per user', async () => {
    render(<UsersPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('user-row').length).toBe(4);
    });
  });

  it('renders avatar initials and capabilities blurb', async () => {
    render(<UsersPage />);
    await waitFor(() => screen.getAllByTestId('user-row'));
    // 4 avatars + the initials inside them
    expect(screen.getAllByTestId('avatar').length).toBe(4);
    expect(screen.getByText('AA')).toBeInTheDocument();
    expect(screen.getByText('DD')).toBeInTheDocument();
    expect(screen.getByText(/manage users/i)).toBeInTheDocument();
    expect(screen.getByText(/Read-only access/i)).toBeInTheDocument();
  });
});
