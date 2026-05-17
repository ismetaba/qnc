import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricsPage } from '../../pages/Metrics.js';
import type { Endpoint, MetricSnapshot } from '@qnc/shared';

const ENDPOINTS: Endpoint[] = [
  { id: 'eth1', name: 'eth-prod', chain: 'eth', createdAt: new Date().toISOString(), token: 't' }
];

function snapshotFor(windowMs: number): MetricSnapshot {
  return {
    endpointId: 'eth1',
    windowMs,
    requestCount: windowMs / 60_000,
    errorCount: 0,
    latencyP50: 1,
    latencyP95: 2,
    latencyP99: 3,
    byMethod: [{ method: 'eth_blockNumber', count: windowMs / 60_000, errors: 0 }]
  };
}

function makeFetch() {
  const calls: string[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith('/v1/endpoints')) {
      return new Response(JSON.stringify(ENDPOINTS), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    const m = url.match(/windowMs=(\d+)/);
    const windowMs = m ? Number(m[1]) : 60_000;
    return new Response(JSON.stringify(snapshotFor(windowMs)), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

describe('US-7 — Metrics window pills drive the windowMs query param', () => {
  let originalFetch: typeof fetch;
  let calls: string[];
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    const made = makeFetch();
    calls = made.calls;
    globalThis.fetch = made.fn;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('clicking each pill (1m / 5m / 1h / 24h) requests the matching windowMs', async () => {
    render(<MetricsPage />);

    // Initial render at 1m (default).
    await waitFor(() => {
      expect(calls.some((u) => u.includes('windowMs=60000'))).toBe(true);
    });

    const user = userEvent.setup();

    for (const [label, ms] of [
      ['5m', 300_000],
      ['1h', 3_600_000],
      ['24h', 86_400_000]
    ] as const) {
      await act(async () => {
        await user.click(screen.getByRole('button', { name: label }));
      });
      await waitFor(() => {
        expect(calls.some((u) => u.includes(`windowMs=${ms}`)), `expected windowMs=${ms} after clicking ${label}`).toBe(true);
      });
    }

    // Sanity: requestCount displayed must match the most-recently-active window.
    // Last clicked was 24h → 86_400_000 / 60_000 = 1440 requests.
    await waitFor(() => {
      expect(screen.getByText('1,440')).toBeInTheDocument();
    });
  });
});
