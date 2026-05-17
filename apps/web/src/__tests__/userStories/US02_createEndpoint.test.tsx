import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RoleProvider } from '../../context/RoleContext.js';
import { ToastProvider } from '../../components/Toast.js';
import { EndpointsPage } from '../../pages/Endpoints.js';
import type { Endpoint } from '@qnc/shared';

const SEEDED: Endpoint[] = [
  { id: 'seed1', name: 'eth-mainnet-prod', chain: 'eth', createdAt: new Date().toISOString(), token: 'qnc_x' }
];

const NEW_ENDPOINT: Endpoint = {
  id: 'new123abc',
  name: 'team-eth',
  chain: 'eth',
  createdAt: new Date().toISOString(),
  token: 'qnc_new'
};

function makeFetch() {
  let listings: Endpoint[] = [...SEEDED];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    if (url.endsWith('/v1/endpoints') && method === 'GET') {
      return new Response(JSON.stringify(listings), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    if (url.endsWith('/v1/endpoints') && method === 'POST') {
      listings = [...listings, NEW_ENDPOINT];
      return new Response(JSON.stringify(NEW_ENDPOINT), {
        status: 201,
        headers: { 'content-type': 'application/json' }
      });
    }
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  });
  return fn as unknown as typeof fetch;
}

describe('US-2 — admin creates an endpoint and the proxy URL appears', () => {
  let originalFetch: typeof fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = makeFetch();
    window.localStorage.setItem('qnc.role', 'admin');
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('admin fills create form → new row + proxy URL copy button appears', async () => {
    const user = userEvent.setup();
    render(
      <RoleProvider>
        <ToastProvider>
          <MemoryRouter>
            <EndpointsPage />
          </MemoryRouter>
        </ToastProvider>
      </RoleProvider>
    );

    // Wait for the seeded row.
    await waitFor(() => {
      expect(screen.getAllByTestId('endpoint-row').length).toBe(1);
    });

    const nameInput = screen.getByLabelText('endpoint name') as HTMLInputElement;
    const chainSelect = screen.getByLabelText('endpoint chain') as HTMLSelectElement;
    await act(async () => {
      await user.clear(nameInput);
      await user.type(nameInput, NEW_ENDPOINT.name);
      await user.selectOptions(chainSelect, 'eth');
      await user.click(screen.getByTestId('create-endpoint-submit'));
    });

    // The new endpoint should land in the table after the optimistic refetch.
    await waitFor(() => {
      expect(screen.getAllByTestId('endpoint-row').length).toBe(2);
    });

    // Proxy URL surfaces with a copy button targeting the new id.
    expect(screen.getByText(`/api/v1/rpc/${NEW_ENDPOINT.id}`)).toBeInTheDocument();
    const copyBtn = screen.getByLabelText(`copy proxy URL for ${NEW_ENDPOINT.name}`);
    expect(copyBtn).toBeInTheDocument();
  });
});
