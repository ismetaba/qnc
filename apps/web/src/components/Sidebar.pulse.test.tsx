import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleProvider } from '../context/RoleContext.js';
import { Sidebar, fleetTone } from './Sidebar.js';
import type { NodeHealth } from '@qnc/shared';

const HEALTHY: NodeHealth[] = [
  { chain: 'eth', status: 'healthy', blockHeight: 1, peers: 1, latencyMs: 1, syncProgress: 1, diskGB: 1, versionText: '', uptimeS: 1 },
  { chain: 'avax', status: 'healthy', blockHeight: 1, peers: 1, latencyMs: 1, syncProgress: 1, diskGB: 1, versionText: '', uptimeS: 1 },
  { chain: 'btc', status: 'healthy', blockHeight: 1, peers: 1, latencyMs: 1, syncProgress: 1, diskGB: 1, versionText: '', uptimeS: 1 }
];

function fakeFetch(nodes: NodeHealth[]) {
  return vi.fn(async () =>
    new Response(JSON.stringify(nodes), { status: 200, headers: { 'content-type': 'application/json' } })
  ) as unknown as typeof fetch;
}

describe('fleetTone()', () => {
  it('returns green for all healthy', () => expect(fleetTone(HEALTHY)).toBe('green'));
  it('returns red when any node is down', () =>
    expect(fleetTone([{ ...HEALTHY[0]!, status: 'down' }, ...HEALTHY.slice(1)])).toBe('red'));
  it('returns amber when any lagging (no down)', () =>
    expect(fleetTone([{ ...HEALTHY[0]!, status: 'lagging' }, ...HEALTHY.slice(1)])).toBe('amber'));
  it('returns unknown for null/empty', () => {
    expect(fleetTone(null)).toBe('unknown');
    expect(fleetTone([])).toBe('unknown');
  });
});

describe('<Sidebar/> nodes pulse dot', () => {
  let original: typeof fetch;
  beforeEach(() => {
    original = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = original;
  });

  function renderSidebar() {
    window.localStorage.setItem('qnc.role', 'admin');
    render(
      <RoleProvider>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </RoleProvider>
    );
  }

  it('renders nav-dot--green when all nodes healthy', async () => {
    globalThis.fetch = fakeFetch(HEALTHY);
    renderSidebar();
    await waitFor(() => expect(screen.getByTestId('nodes-pulse')).toBeInTheDocument());
    expect(screen.getByTestId('nodes-pulse').dataset.tone).toBe('green');
  });

  it('renders nav-dot--red when any node is down', async () => {
    globalThis.fetch = fakeFetch([{ ...HEALTHY[0]!, status: 'down' }, ...HEALTHY.slice(1)]);
    renderSidebar();
    await waitFor(() => expect(screen.getByTestId('nodes-pulse')).toBeInTheDocument());
    expect(screen.getByTestId('nodes-pulse').dataset.tone).toBe('red');
  });

  it('renders nav-dot--amber when any node lagging', async () => {
    globalThis.fetch = fakeFetch([{ ...HEALTHY[0]!, status: 'lagging' }, ...HEALTHY.slice(1)]);
    renderSidebar();
    await waitFor(() => expect(screen.getByTestId('nodes-pulse')).toBeInTheDocument());
    expect(screen.getByTestId('nodes-pulse').dataset.tone).toBe('amber');
  });
});
