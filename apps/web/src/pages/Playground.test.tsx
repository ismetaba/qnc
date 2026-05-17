import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RoleProvider } from '../context/RoleContext.js';
import { ToastProvider } from '../components/Toast.js';
import { PlaygroundPage } from './Playground.js';
import type { Endpoint, Role } from '@qnc/shared';

const FAKE_ENDPOINTS: Endpoint[] = [
  { id: 'eth1', name: 'eth-prod', chain: 'eth', createdAt: new Date().toISOString(), token: 't1' },
  { id: 'btc1', name: 'btc-prod', chain: 'btc', createdAt: new Date().toISOString(), token: 't2' }
];

function makeFetch(rpcResponse?: unknown) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/v1/endpoints')) {
      return new Response(JSON.stringify(FAKE_ENDPOINTS), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    if (url.includes('/v1/rpc/')) {
      return new Response(JSON.stringify(rpcResponse ?? { jsonrpc: '2.0', id: 1, result: '0xdeadbeef' }), {
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
          <PlaygroundPage />
        </MemoryRouter>
      </ToastProvider>
    </RoleProvider>
  );
}

describe('<PlaygroundPage/>', () => {
  let originalFetch: typeof fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = makeFetch();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders EVM sample chips when an eth endpoint is selected', async () => {
    renderAs('admin');
    await waitFor(() => {
      expect(screen.getAllByTestId('sample-chip').length).toBeGreaterThan(0);
    });
    const chips = screen.getAllByTestId('sample-chip').map((b) => b.textContent);
    expect(chips).toContain('eth_blockNumber');
    expect(chips).toContain('eth_chainId');
    expect(chips).not.toContain('getblockcount');
  });

  it('switches to BTC chips when a btc endpoint is selected', async () => {
    renderAs('admin');
    const select = await screen.findByLabelText('endpoint');
    await act(async () => {
      const user = userEvent.setup();
      await user.selectOptions(select, 'btc1');
    });
    const chips = screen.getAllByTestId('sample-chip').map((b) => b.textContent);
    expect(chips).toContain('getblockcount');
    expect(chips).not.toContain('eth_blockNumber');
  });

  it('clicking a sample chip fills method + params', async () => {
    renderAs('admin');
    await waitFor(() => screen.getAllByTestId('sample-chip'));
    const user = userEvent.setup();
    const chainIdChip = screen
      .getAllByTestId('sample-chip')
      .find((b) => b.textContent === 'eth_chainId')!;
    await act(async () => {
      await user.click(chainIdChip);
    });
    const methodInput = screen.getByLabelText('rpc method') as HTMLInputElement;
    const paramsInput = screen.getByLabelText('rpc params') as HTMLTextAreaElement;
    expect(methodInput.value).toBe('eth_chainId');
    expect(paramsInput.value).toBe('[]');
  });

  it('Send posts to /api/v1/rpc/:id and renders the response', async () => {
    renderAs('admin');
    await waitFor(() => screen.getByTestId('playground-send'));
    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByTestId('playground-send'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('playground-response').textContent).toMatch(/0xdeadbeef/);
    });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const calls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u.includes('/v1/rpc/eth1'))).toBe(true);
  });

  it('shows an error for invalid JSON params', async () => {
    renderAs('admin');
    await waitFor(() => screen.getByTestId('playground-send'));
    const user = userEvent.setup();
    const paramsInput = screen.getByLabelText('rpc params') as HTMLTextAreaElement;
    await act(async () => {
      await user.clear(paramsInput);
      await user.type(paramsInput, 'not-json');
      await user.click(screen.getByTestId('playground-send'));
    });
    expect(screen.getByTestId('playground-error')).toBeInTheDocument();
  });

  it('billing role sees no Send button', async () => {
    renderAs('billing');
    await waitFor(() => screen.getAllByTestId('sample-chip'));
    expect(screen.queryByTestId('playground-send')).not.toBeInTheDocument();
  });
});
