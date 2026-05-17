import { describe, it, expect } from 'vitest';
import { buildApi } from './server.js';
import { pushLog, RPC_LOG_CAP, createStore } from './store.js';

describe('apps/api scaffolding', () => {
  it('GET /health → { ok: true }', async () => {
    const { app } = await buildApi();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.json()).toEqual({ ok: true });
  });

  it('GET /v1/users returns 4 users with one of each role', async () => {
    const { app } = await buildApi();
    const res = await app.inject({ method: 'GET', url: '/v1/users' });
    const users = res.json();
    expect(users).toHaveLength(4);
    expect(users.map((u: { role: string }) => u.role).sort()).toEqual([
      'admin',
      'billing',
      'developer',
      'viewer'
    ]);
  });

  it('GET /v1/endpoints returns the 3 seeded endpoints with qnc_ tokens', async () => {
    const { app } = await buildApi();
    const res = await app.inject({ method: 'GET', url: '/v1/endpoints' });
    const endpoints = res.json();
    expect(endpoints).toHaveLength(3);
    const names = endpoints.map((e: { name: string }) => e.name).sort();
    expect(names).toEqual(['avax-cchain-prod', 'btc-mainnet-prod', 'eth-mainnet-prod']);
    for (const e of endpoints) {
      expect(e.token).toMatch(/^qnc_[A-Za-z0-9_-]{20}$/);
    }
  });

  it('POST /v1/endpoints creates a new endpoint', async () => {
    const { app, store } = await buildApi();
    const before = store.endpoints.length;
    const res = await app.inject({
      method: 'POST',
      url: '/v1/endpoints',
      payload: { name: 'my-eth', chain: 'eth' }
    });
    expect(res.statusCode).toBe(201);
    const created = res.json();
    expect(created.name).toBe('my-eth');
    expect(created.chain).toBe('eth');
    expect(created.token).toMatch(/^qnc_/);
    expect(store.endpoints.length).toBe(before + 1);
  });

  it('POST /v1/endpoints rejects missing name (400)', async () => {
    const { app } = await buildApi();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/endpoints',
      payload: { chain: 'eth' }
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /v1/endpoints rejects bad chain (400)', async () => {
    const { app } = await buildApi();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/endpoints',
      payload: { name: 'x', chain: 'sol' }
    });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE /v1/endpoints/:id removes the endpoint', async () => {
    const { app, store } = await buildApi();
    const id = store.endpoints[0]!.id;
    const res = await app.inject({ method: 'DELETE', url: `/v1/endpoints/${id}` });
    expect(res.statusCode).toBe(200);
    expect(store.endpoints.find((e) => e.id === id)).toBeUndefined();
  });

  it('DELETE /v1/endpoints/:id returns 404 when missing', async () => {
    const { app } = await buildApi();
    const res = await app.inject({ method: 'DELETE', url: '/v1/endpoints/missing' });
    expect(res.statusCode).toBe(404);
  });

  it('GET /v1/billing/invoices returns 6 invoices', async () => {
    const { app } = await buildApi();
    const res = await app.inject({ method: 'GET', url: '/v1/billing/invoices' });
    const invoices = res.json();
    expect(invoices).toHaveLength(6);
    for (const inv of invoices) {
      expect(['paid', 'open', 'past_due']).toContain(inv.status);
    }
  });
});

describe('pushLog circular buffer', () => {
  it('caps the log at RPC_LOG_CAP entries', () => {
    const store = createStore();
    for (let i = 0; i < RPC_LOG_CAP + 250; i++) {
      pushLog(store, {
        ts: i,
        endpointId: 'x',
        chain: 'eth',
        method: 'eth_blockNumber',
        durationMs: 1,
        ok: true
      });
    }
    expect(store.rpcLog.length).toBe(RPC_LOG_CAP);
    // oldest entries dropped from the front
    expect(store.rpcLog[0]!.ts).toBe(250);
  });
});
