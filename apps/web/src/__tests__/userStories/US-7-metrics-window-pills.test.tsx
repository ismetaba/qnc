/**
 * Spec User Story #7:
 *   "...a Metrics page with windowed pills (1m / 5m / 1h / 24h), p50/p95/p99
 *   latency stat cards, and a by-method bar chart that polls every 3 seconds."
 *
 * This test asserts that clicking each window pill drives a /v1/metrics fetch
 * with the matching `windowMs` query parameter (1m=60000, 5m=300000, 1h=3600000, 24h=86400000).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricsPage } from '../../pages/Metrics.js';
import type { Endpoint, MetricSnapshot } from '@qnc/shared';

const ENDPOINT: Endpoint = {
  id: 'eth1',
  name: 'eth-mainnet-prod',
  chain: 'eth',
  createdAt: new Date().toISOString(),
  token: 'qnc_x'
};

function blankSnapshot(windowMs: number): MetricSnapshot {
  return {
    endpointId: ENDPOINT.id,
    windowMs,
    requestCount: 0,
    errorCount: 0,
    latencyP50: 0,
    latencyP95: 0,
    latencyP99: 0,
    byMethod: []
  };
}

describe('US-7: metrics window pills wire windowMs into the API call', () => {
  let original: typeof fetch;
  let calls: string[] = [];

  beforeEach(() => {
    original = globalThis.fetch;
    calls = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith('/v1/endpoints')) {
        return new Response(JSON.stringify([ENDPOINT]), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/v1/metrics')) {
        const m = url.match(/windowMs=(\d+)/);
        const windowMs = m ? Number(m[1]) : 60_000;
        return new Response(JSON.stringify(blankSnapshot(windowMs)), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = original;
  });

  it('clicking 1m / 5m / 1h / 24h fires fetches with the matching windowMs', async () => {
    render(<MetricsPage />);

    // Initial render polls /v1/metrics with the default 1m window.
    await waitFor(() => {
      expect(calls.some((c) => c.includes('windowMs=60000'))).toBe(true);
    });

    const user = userEvent.setup();
    const expected: Array<{ label: string; ms: number }> = [
      { label: '5m', ms: 300_000 },
      { label: '1h', ms: 3_600_000 },
      { label: '24h', ms: 86_400_000 },
      { label: '1m', ms: 60_000 }
    ];
    for (const { label, ms } of expected) {
      const before = calls.length;
      await act(async () => {
        await user.click(screen.getByRole('button', { name: label }));
      });
      await waitFor(() => {
        const fired = calls.slice(before).some((c) => c.includes(`windowMs=${ms}`));
        expect(fired, `expected windowMs=${ms} after clicking ${label}; got ${calls.slice(before).join(' | ')}`).toBe(true);
      });
    }
  });
});
