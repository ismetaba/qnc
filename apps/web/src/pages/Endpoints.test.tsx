import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleProvider } from '../context/RoleContext.js';
import { ToastProvider } from '../components/Toast.js';
import { EndpointsPage } from './Endpoints.js';
import type { Endpoint, Role } from '@qnc/shared';

const FAKE_ENDPOINTS: Endpoint[] = [
  { id: 'aaa1', name: 'eth-prod', chain: 'eth', createdAt: new Date().toISOString(), token: 'qnc_a' },
  { id: 'bbb2', name: 'avax-prod', chain: 'avax', createdAt: new Date().toISOString(), token: 'qnc_b' },
  { id: 'ccc3', name: 'btc-prod', chain: 'btc', createdAt: new Date().toISOString(), token: 'qnc_c' }
];

function makeFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/v1/endpoints')) {
      return new Response(JSON.stringify(FAKE_ENDPOINTS), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
}

function renderAs(role: Role) {
  window.localStorage.setItem('qnc.role', role);
  return render(
    <RoleProvider>
      <ToastProvider>
        <MemoryRouter>
          <EndpointsPage />
        </MemoryRouter>
      </ToastProvider>
    </RoleProvider>
  );
}

describe('<EndpointsPage/>', () => {
  let originalFetch: typeof fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = makeFetch();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders one row per endpoint', async () => {
    renderAs('admin');
    await waitFor(() => {
      expect(screen.getAllByTestId('endpoint-row').length).toBe(3);
    });
    expect(screen.getByText('eth-prod')).toBeInTheDocument();
    expect(screen.getByText('btc-prod')).toBeInTheDocument();
  });

  it('admin sees Create form and Delete buttons', async () => {
    renderAs('admin');
    await waitFor(() => {
      expect(screen.getAllByTestId('endpoint-row').length).toBe(3);
    });
    expect(screen.getByTestId('create-endpoint-form')).toBeInTheDocument();
    expect(screen.getAllByTestId('kebab-trigger').length).toBe(3);
  });

  it('developer sees Create but no Delete', async () => {
    renderAs('developer');
    await waitFor(() => {
      expect(screen.getAllByTestId('endpoint-row').length).toBe(3);
    });
    expect(screen.getByTestId('create-endpoint-form')).toBeInTheDocument();
    expect(screen.queryAllByTestId('kebab-trigger').length).toBe(0);
  });

  it('viewer sees neither Create nor Delete', async () => {
    renderAs('viewer');
    await waitFor(() => {
      expect(screen.getAllByTestId('endpoint-row').length).toBe(3);
    });
    expect(screen.queryByTestId('create-endpoint-form')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('kebab-trigger').length).toBe(0);
  });
});
