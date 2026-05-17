import { describe, it, expect, vi } from 'vitest';
import { forward } from './proxy.js';
import { createStore, pushLog } from './store.js';
import { computeMetrics } from './metrics.js';
import { buildApi } from './server.js';

function makeFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' }
    })
  ) as unknown as typeof fetch;
}

describe('proxy.forward', () => {
  it('records a successful RPC call to rpcLog and returns body', async () => {
    const store = createStore();
    const endpoint = store.endpoints.find((e) => e.chain === 'eth')!;
    const fakeFetch = makeFetch({ jsonrpc: '2.0', id: 1, result: '0xdead' });
    const out = await forward(store, endpoint, { method: 'eth_blockNumber', id: 1 }, { fetchImpl: fakeFetch });
    expect(out.body).toMatchObject({ result: '0xdead' });
    expect(store.rpcLog).toHaveLength(1);
    expect(store.rpcLog[0]).toMatchObject({
      endpointId: endpoint.id,
      chain: 'eth',
      method: 'eth_blockNumber',
      ok: true
    });
  });

  it('marks JSON-RPC error responses as ok=false in the log', async () => {
    const store = createStore();
    const endpoint = store.endpoints.find((e) => e.chain === 'eth')!;
    const fakeFetch = makeFetch({ jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'no' } });
    const out = await forward(store, endpoint, { method: 'bogus' }, { fetchImpl: fakeFetch });
    expect(out.body).toMatchObject({ error: { code: -32601 } });
    expect(store.rpcLog[0]?.ok).toBe(false);
    expect(store.rpcLog[0]?.error).toMatch(/-32601/);
  });

  it('handles upstream network failures', async () => {
    const store = createStore();
    const endpoint = store.endpoints.find((e) => e.chain === 'btc')!;
    const fakeFetch = vi.fn(async () => {
      throw new Error('boom');
    }) as unknown as typeof fetch;
    const out = await forward(store, endpoint, { method: 'getblockcount' }, { fetchImpl: fakeFetch });
    expect(store.rpcLog[0]?.ok).toBe(false);
    expect(store.rpcLog[0]?.error).toMatch(/boom/);
    expect(out.status).toBe(502);
  });
});

describe('POST /v1/rpc/:endpointId', () => {
  it('proxies and returns 404 for unknown endpoint', async () => {
    const fakeFetch = makeFetch({ jsonrpc: '2.0', id: 1, result: '0x1' });
    const { app } = await buildApi({ rpc: { forwardOpts: { fetchImpl: fakeFetch } } });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/rpc/missing',
      payload: { method: 'eth_blockNumber' }
    });
    expect(res.statusCode).toBe(404);
  });

  it('records the call in store rpcLog and surfaces in metrics within the window', async () => {
    const fakeFetch = makeFetch({ jsonrpc: '2.0', id: 1, result: '0x1' });
    const { app, store } = await buildApi({ rpc: { forwardOpts: { fetchImpl: fakeFetch } } });
    const ep = store.endpoints[0]!;
    await app.inject({
      method: 'POST',
      url: `/v1/rpc/${ep.id}`,
      payload: { method: 'eth_blockNumber', id: 1 }
    });
    const m = computeMetrics(store.rpcLog, ep.id, 60_000);
    expect(m.requestCount).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /v1/logs', () => {
  it('returns reverse-chronological entries, capped at limit', async () => {
    const { app, store } = await buildApi();
    const ep = store.endpoints[0]!;
    for (let i = 0; i < 5; i++) {
      pushLog(store, {
        ts: Date.now() + i,
        endpointId: ep.id,
        chain: ep.chain,
        method: 'm',
        durationMs: i,
        ok: true
      });
    }
    const res = await app.inject({ method: 'GET', url: `/v1/logs?endpointId=${ep.id}&limit=3` });
    const out = res.json();
    expect(out).toHaveLength(3);
    expect(out[0].durationMs).toBeGreaterThan(out[2].durationMs);
  });
});

describe('GET /v1/usage', () => {
  it('returns base $49 with 0 overage and no logs', async () => {
    const { app } = await buildApi();
    const res = await app.inject({ method: 'GET', url: '/v1/usage' });
    const u = res.json();
    expect(u.totalRequests).toBe(0);
    expect(u.errorRate).toBe(0);
    expect(u.monthToDate.included).toBe(80_000_000);
    expect(u.monthToDate.estimatedCostUsd).toBe(49);
  });
});

describe('GET /v1/nodes', () => {
  it('returns 3 NodeHealth entries from mocked fetch', async () => {
    const fakeFetch = vi.fn(async (url: RequestInfo | URL) => {
      const u = String(url);
      const chain = u.includes('8501') ? 'eth' : u.includes('8502') ? 'avax' : 'btc';
      const body = { chain, ticker: chain.toUpperCase(), blockHeight: 12345, uptimeS: 9 };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }) as unknown as typeof fetch;

    const { app } = await buildApi({ nodes: { fetchImpl: fakeFetch } });
    const res = await app.inject({ method: 'GET', url: '/v1/nodes' });
    const out = res.json();
    expect(out).toHaveLength(3);
    expect(out.map((n: { chain: string }) => n.chain).sort()).toEqual(['avax', 'btc', 'eth']);
    for (const n of out) {
      expect(n.status).toBe('healthy');
      expect(n.blockHeight).toBe(12345);
    }
  });

  it('marks unreachable nodes as down', async () => {
    const fakeFetch = vi.fn(async () => {
      throw new Error('refused');
    }) as unknown as typeof fetch;
    const { app } = await buildApi({ nodes: { fetchImpl: fakeFetch } });
    const res = await app.inject({ method: 'GET', url: '/v1/nodes' });
    const out = res.json();
    expect(out.every((n: { status: string }) => n.status === 'down')).toBe(true);
  });
});
