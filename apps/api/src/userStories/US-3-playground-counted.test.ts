/**
 * Spec User Story #3:
 *   "...have that call counted in metrics within a second."
 * Integration test: buildApi() with stubbed mock-node fetch → POST /v1/rpc/:id
 * → GET /v1/metrics?windowMs=60000 immediately → assert requestCount === 1.
 */
import { describe, it, expect, vi } from 'vitest';
import { buildApi } from '../server.js';

describe('US-3: playground call counted in metrics within 1 s', () => {
  it('reflects a single POST in /v1/metrics on the very next call', async () => {
    const stubFetch = vi.fn(async () =>
      new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0xdeadbeef' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    ) as unknown as typeof fetch;

    const start = Date.now();
    const { app, store } = await buildApi({ rpc: { forwardOpts: { fetchImpl: stubFetch } } });
    const ep = store.endpoints.find((e) => e.chain === 'eth')!;

    // 1) Playground call.
    const rpcRes = await app.inject({
      method: 'POST',
      url: `/v1/rpc/${ep.id}`,
      payload: { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }
    });
    expect(rpcRes.statusCode).toBe(200);

    // 2) Immediately fetch metrics.
    const metricsRes = await app.inject({
      method: 'GET',
      url: `/v1/metrics?endpointId=${ep.id}&windowMs=60000`
    });
    const metrics = metricsRes.json();
    expect(metrics.requestCount).toBe(1);
    expect(metrics.errorCount).toBe(0);
    expect(metrics.byMethod).toContainEqual(
      expect.objectContaining({ method: 'eth_blockNumber', count: 1 })
    );

    // SLO sanity: this whole interaction completed well under 1 s.
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
