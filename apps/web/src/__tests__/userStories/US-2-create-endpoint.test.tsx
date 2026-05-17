/**
 * Spec User Story #2:
 *   "As an admin user, I want to create a new endpoint pinned to a chain and
 *   immediately see a copyable proxy URL (`/api/v1/rpc/<id>`)..."
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RoleProvider } from '../../context/RoleContext.js';
import { ToastProvider } from '../../components/Toast.js';
import { EndpointsPage } from '../../pages/Endpoints.js';
import type { Endpoint } from '@qnc/shared';

const SEEDED: Endpoint[] = [
  { id: 'seed1', name: 'eth-mainnet-prod', chain: 'eth', createdAt: new Date().toISOString(), token: 't' }
];

const NEW_ENDPOINT: Endpoint = {
  id: 'newId123',
  name: 'team-alpha',
  chain: 'avax',
  createdAt: new Date().toISOString(),
  token: 'qnc_newtokensample01234'
};

describe('US-2: admin creates endpoint and sees proxy URL', () => {
  let original: typeof fetch;
  let listCalls = 0;

  beforeEach(() => {
    original = globalThis.fetch;
    listCalls = 0;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (url.endsWith('/v1/endpoints') && method === 'GET') {
        listCalls += 1;
        // Initially only the seed; after creation include the new endpoint.
        const body = listCalls === 1 ? SEEDED : [...SEEDED, NEW_ENDPOINT];
        return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.endsWith('/v1/endpoints') && method === 'POST') {
        return new Response(JSON.stringify(NEW_ENDPOINT), { status: 201, headers: { 'content-type': 'application/json' } });
      }
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = original;
  });

  it('creates the endpoint and renders a copy button targeting /api/v1/rpc/<new-id>', async () => {
    window.localStorage.setItem('qnc.role', 'admin');
    render(
      <RoleProvider>
        <ToastProvider>
          <MemoryRouter>
            <EndpointsPage />
          </MemoryRouter>
        </ToastProvider>
      </RoleProvider>
    );

    // Initial state: seed endpoint visible.
    await waitFor(() => expect(screen.getByText('eth-mainnet-prod')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('endpoint name'), 'team-alpha');
    await user.selectOptions(screen.getByLabelText('endpoint chain'), 'avax');
    await user.click(screen.getByTestId('create-endpoint-submit'));

    // The new endpoint should appear after the refetch.
    await waitFor(() => expect(screen.getByText('team-alpha')).toBeInTheDocument());

    // The proxy URL must be present and copyable.
    const expectedUrl = `/api/v1/rpc/${NEW_ENDPOINT.id}`;
    expect(screen.getByText(expectedUrl)).toBeInTheDocument();
    const copyBtn = screen.getByLabelText(`copy proxy URL for ${NEW_ENDPOINT.name}`);
    expect(copyBtn).toBeInTheDocument();
  });
});
