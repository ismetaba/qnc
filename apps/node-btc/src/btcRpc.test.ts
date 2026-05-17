import { describe, it, expect } from 'vitest';
import { buildBtcServer } from './server.js';
import { SUPPORTED_BTC_METHODS } from './btcRpc.js';

const CFG = { port: 0, tickMs: 600_000, initialHeight: 850_000 };

async function rpc(app: Awaited<ReturnType<typeof buildBtcServer>>['app'], body: unknown) {
  return app.inject({
    method: 'POST',
    url: '/',
    headers: { 'content-type': 'application/json' },
    payload: body as object
  });
}

describe('BTC mock node', () => {
  it('exposes all 12 BTC methods', () => {
    const required = [
      'getblockcount',
      'getbestblockhash',
      'getblockchaininfo',
      'getnetworkinfo',
      'getmempoolinfo',
      'getblockhash',
      'getblock',
      'getrawtransaction',
      'getbalance',
      'estimatesmartfee',
      'getmininginfo',
      'getpeerinfo'
    ];
    for (const m of required) expect(SUPPORTED_BTC_METHODS).toContain(m);
  });

  it('GET / returns btc/BTC chain status', async () => {
    const { app } = buildBtcServer(CFG);
    const res = await app.inject({ method: 'GET', url: '/' });
    const body = res.json();
    expect(body.chain).toBe('btc');
    expect(body.ticker).toBe('BTC');
    expect(typeof body.blockHeight).toBe('number');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('getblockcount returns positive integer', async () => {
    const { app } = buildBtcServer(CFG);
    const res = (await rpc(app, { id: 1, method: 'getblockcount', params: [] })).json();
    expect(typeof res.result).toBe('number');
    expect(res.result).toBeGreaterThan(0);
  });

  it('getblockchaininfo contains chain, blocks, bestblockhash', async () => {
    const { app } = buildBtcServer(CFG);
    const res = (await rpc(app, { id: 1, method: 'getblockchaininfo', params: [] })).json();
    expect(res.result).toMatchObject({
      chain: 'main',
      blocks: expect.any(Number),
      bestblockhash: expect.any(String)
    });
  });

  it('getnetworkinfo reports version 260000', async () => {
    const { app } = buildBtcServer(CFG);
    const res = (await rpc(app, { id: 1, method: 'getnetworkinfo', params: [] })).json();
    expect(res.result.version).toBe(260000);
  });

  it('unknown method returns -32601', async () => {
    const { app } = buildBtcServer(CFG);
    const res = (await rpc(app, { id: 9, method: 'totally_fake', params: [] })).json();
    expect(res.error.code).toBe(-32601);
    expect(res.id).toBe(9);
  });
});
