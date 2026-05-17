import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { App } from './App.js';

function fakeFetch() {
  return vi.fn(async () =>
    new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })
  ) as unknown as typeof fetch;
}

describe('<App/> boot redirect to /switch', () => {
  let original: typeof fetch;
  beforeEach(() => {
    original = globalThis.fetch;
    globalThis.fetch = fakeFetch();
    // Ensure no role pre-set.
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });
  afterEach(() => {
    globalThis.fetch = original;
  });

  it('renders the role-picker (no sidebar/header) when localStorage has no role', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('switch-page')).toBeInTheDocument();
    });
    // The full-bleed switch page does NOT render the dashboard sidebar.
    expect(screen.queryByLabelText('primary')).not.toBeInTheDocument();
  });

  it('renders the dashboard shell when localStorage has a role', async () => {
    window.localStorage.setItem('qnc.role', 'admin');
    window.history.replaceState({}, '', '/');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByLabelText('primary')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('switch-page')).not.toBeInTheDocument();
  });
});
