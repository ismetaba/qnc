import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SettingsPage } from './Settings.js';
import { RoleProvider } from '../context/RoleContext.js';

function renderPage() {
  return render(
    <RoleProvider>
      <SettingsPage />
    </RoleProvider>,
  );
}

function fakeFetch() {
  return vi.fn(async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  ) as unknown as typeof fetch;
}

describe('<SettingsPage/>', () => {
  let original: typeof fetch;
  beforeEach(() => {
    original = globalThis.fetch;
    globalThis.fetch = fakeFetch();
  });
  afterEach(() => {
    globalThis.fetch = original;
  });

  it('shows the workspace facts', async () => {
    renderPage();
    expect(screen.getByText('QNC Demo')).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
    // Build defaults to 'dev'
    expect(screen.getByText('dev')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('ok')).toBeInTheDocument();
    });
  });
});
