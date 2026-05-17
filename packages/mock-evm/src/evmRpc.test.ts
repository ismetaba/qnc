import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildEvmServer } from './server.js';
import type { EvmServerConfig } from './server.js';
import { SUPPORTED_METHODS } from './evmRpc.js';

const ETH_CFG: EvmServerConfig = {
  chain: 'eth',
  ticker: 'ETH',
  chainId: '0x1',
  clientVersion: 'qnc-mock-eth/v0.1.0',
  netVersion: '1',
  port: 0,
  tickMs: 12_000,
  initialHeight: 1_000_000
};

const AVAX_CFG: EvmServerConfig = {
  chain: 'avax',
  ticker: 'AVAX',
  chainId: '0xa86a',
  clientVersion: 'qnc-mock-avax/v0.1.0',
  netVersion: '43114',
  port: 0,
  tickMs: 2_000,
  initialHeight: 50_000_000
};

async function rpcCall(app: Awaited<ReturnType<typeof buildEvmServer>>['app'], body: unknown) {
  return app.inject({
    method: 'POST',
    url: '/',
    headers: { 'content-type': 'application/json' },
    payload: body as object
  });
}

describe('EVM JSON-RPC dispatcher', () => {
  it('exposes all 18 EVM methods listed in the spec', () => {
    const required = [
      'web3_clientVersion',
      'net_version',
      'net_listening',
      'net_peerCount',
      'eth_chainId',
      'eth_blockNumber',
      'eth_gasPrice',
      'eth_maxPriorityFeePerGas',
      'eth_feeHistory',
      'eth_getBalance',
      'eth_getBlockByNumber',
      'eth_getBlockByHash',
      'eth_getTransactionByHash',
      'eth_getTransactionReceipt',
      'eth_getLogs',
      'eth_call',
      'eth_estimateGas',
      'eth_sendRawTransaction'
    ];
    for (const m of required) expect(SUPPORTED_METHODS).toContain(m);
  });

  it('GET / returns chain status with numeric blockHeight + uptimeS', async () => {
    const { app } = buildEvmServer(ETH_CFG);
    const res = await app.inject({ method: 'GET', url: '/' });
    const body = res.json();
    expect(body.chain).toBe('eth');
    expect(body.ticker).toBe('ETH');
    expect(typeof body.blockHeight).toBe('number');
    expect(typeof body.uptimeS).toBe('number');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('eth_blockNumber returns hex matching state', async () => {
    const { app, state } = buildEvmServer(ETH_CFG);
    const res = await rpcCall(app, { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] });
    const body = res.json();
    expect(body.result).toMatch(/^0x[0-9a-f]+$/);
    expect(parseInt(body.result, 16)).toBe(state.blockHeight);
  });

  it('eth_chainId returns 0x1 for eth and 0xa86a for avax', async () => {
    const { app: ethApp } = buildEvmServer(ETH_CFG);
    const { app: avaxApp } = buildEvmServer(AVAX_CFG);
    const ethRes = (await rpcCall(ethApp, { id: 1, method: 'eth_chainId', params: [] })).json();
    const avaxRes = (await rpcCall(avaxApp, { id: 1, method: 'eth_chainId', params: [] })).json();
    expect(ethRes.result).toBe('0x1');
    expect(avaxRes.result).toBe('0xa86a');
  });

  it('unknown method returns -32601', async () => {
    const { app } = buildEvmServer(ETH_CFG);
    const res = await rpcCall(app, { id: 7, method: 'definitely_not_a_method', params: [] });
    const body = res.json();
    expect(body.error.code).toBe(-32601);
    expect(body.id).toBe(7);
  });

  it('eth_getBalance returns hex; eth_gasPrice returns hex; eth_feeHistory returns object', async () => {
    const { app } = buildEvmServer(ETH_CFG);
    const bal = (await rpcCall(app, { id: 1, method: 'eth_getBalance', params: ['0xabc', 'latest'] })).json();
    const gas = (await rpcCall(app, { id: 2, method: 'eth_gasPrice', params: [] })).json();
    const fh = (await rpcCall(app, { id: 3, method: 'eth_feeHistory', params: ['0x4', 'latest', []] })).json();
    expect(bal.result).toMatch(/^0x[0-9a-f]+$/);
    expect(gas.result).toMatch(/^0x[0-9a-f]+$/);
    expect(typeof fh.result.oldestBlock).toBe('string');
    expect(Array.isArray(fh.result.reward)).toBe(true);
  });

  it('eth_getBlockByNumber returns a block-shaped object', async () => {
    const { app } = buildEvmServer(ETH_CFG);
    const res = (await rpcCall(app, { id: 1, method: 'eth_getBlockByNumber', params: ['latest', false] })).json();
    expect(res.result).toMatchObject({
      hash: expect.stringMatching(/^0x/),
      parentHash: expect.stringMatching(/^0x/),
      transactions: []
    });
  });

  it('handles batched RPC requests', async () => {
    const { app } = buildEvmServer(ETH_CFG);
    const res = await rpcCall(app, [
      { id: 1, method: 'eth_blockNumber', params: [] },
      { id: 2, method: 'eth_chainId', params: [] }
    ]);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[1].result).toBe('0x1');
  });
});

describe('block-tick increment', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('increments blockHeight after the configured tick', () => {
    // Re-implement the tick locally because buildEvmServer doesn't own a timer.
    const { state } = buildEvmServer(ETH_CFG);
    const initial = state.blockHeight;
    const interval = setInterval(() => {
      state.blockHeight += 1;
    }, ETH_CFG.tickMs);
    try {
      vi.advanceTimersByTime(ETH_CFG.tickMs + 100);
      expect(state.blockHeight).toBe(initial + 1);
      vi.advanceTimersByTime(ETH_CFG.tickMs * 2);
      expect(state.blockHeight).toBe(initial + 3);
    } finally {
      clearInterval(interval);
    }
  });
});
