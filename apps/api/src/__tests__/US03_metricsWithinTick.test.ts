import { describe, it, expect, vi } from 'vitest';
import { buildApi } from '../server.js';

function fakeNodeFetch() {
  return vi.fn(async () =>
    new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x1298be0' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  ) as unknown as typeof fetch;
}

describe('US-3 — Playground call counted in /v1/metrics within 1 tick', () => {
  it('POST /v1/rpc/:id is reflected in GET /v1/metrics on the immediate next request', async () => {
    const fetchImpl = fakeNodeFetch();
    const { app, store } = await buildApi({ rpc: { forwardOpts: { fetchImpl } } });
    const ep = store.endpoints.find((e) => e.chain === 'eth');
    expect(ep).toBeDefined();

    // Send one Playground-style call.
    const sendRes = await app.inject({
      method: 'POST',
      url: `/v1/rpc/${ep!.id}`,
      payload: { jsonrpc: '2.0', id: 7, method: 'eth_blockNumber', params: [] }
    });
    expect(sendRes.statusCode).toBe(200);
    expect(sendRes.json()).toMatchObject({ result: '0x1298be0' });

    // Immediate metrics fetch — no setTimeout, no awaiting a tick.
    const metricsRes = await app.inject({
      method: 'GET',
      url: `/v1/metrics?endpointId=${ep!.id}&windowMs=60000`
    });
    const m = metricsRes.json();
    expect(m.endpointId).toBe(ep!.id);
    expect(m.requestCount).toBe(1);
    expect(m.errorCount).toBe(0);
    expect(m.byMethod).toEqual([{ method: 'eth_blockNumber', count: 1, errors: 0 }]);
  });
});
