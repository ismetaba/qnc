import type { Chain } from '@qnc/shared';
import { nowIsoSeconds, randomHex, randomHexInt, toHex } from './hex.js';
import type { NodeState } from './state.js';

export interface EvmConfig {
  chain: Chain;
  ticker: string;
  chainId: string;
  clientVersion: string;
  netVersion: string;
}

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: unknown;
}

export type JsonRpcSuccess = {
  jsonrpc: '2.0';
  id: number | string | null;
  result: unknown;
};

export type JsonRpcError = {
  jsonrpc: '2.0';
  id: number | string | null;
  error: { code: number; message: string };
};

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

type Handler = (params: unknown[], state: NodeState, cfg: EvmConfig) => unknown;

function paramsArray(p: unknown): unknown[] {
  return Array.isArray(p) ? p : [];
}

function buildBlock(numHex: string): Record<string, unknown> {
  return {
    number: numHex,
    hash: randomHex(32),
    parentHash: randomHex(32),
    nonce: randomHex(8),
    sha3Uncles: randomHex(32),
    logsBloom: '0x' + '0'.repeat(512),
    transactionsRoot: randomHex(32),
    stateRoot: randomHex(32),
    receiptsRoot: randomHex(32),
    miner: randomHex(20),
    difficulty: '0x0',
    totalDifficulty: '0x0',
    extraData: '0x',
    size: toHex(50_000 + Math.floor(Math.random() * 30_000)),
    gasLimit: toHex(30_000_000),
    gasUsed: toHex(15_000_000 + Math.floor(Math.random() * 5_000_000)),
    timestamp: toHex(nowIsoSeconds()),
    transactions: [],
    uncles: []
  };
}

function buildTx(): Record<string, unknown> {
  return {
    blockHash: randomHex(32),
    blockNumber: toHex(1_000_000),
    from: randomHex(20),
    gas: toHex(21_000),
    gasPrice: toHex(20_000_000_000),
    hash: randomHex(32),
    input: '0x',
    nonce: '0x0',
    to: randomHex(20),
    transactionIndex: '0x0',
    value: toHex(1_000_000_000_000_000n),
    v: '0x1c',
    r: randomHex(32),
    s: randomHex(32)
  };
}

function buildReceipt(): Record<string, unknown> {
  return {
    transactionHash: randomHex(32),
    transactionIndex: '0x0',
    blockHash: randomHex(32),
    blockNumber: toHex(1_000_000),
    from: randomHex(20),
    to: randomHex(20),
    cumulativeGasUsed: toHex(21_000),
    gasUsed: toHex(21_000),
    contractAddress: null,
    logs: [],
    logsBloom: '0x' + '0'.repeat(512),
    status: '0x1',
    effectiveGasPrice: toHex(20_000_000_000)
  };
}

const HANDLERS: Record<string, Handler> = {
  web3_clientVersion: (_p, _s, c) => c.clientVersion,
  net_version: (_p, _s, c) => c.netVersion,
  net_listening: () => true,
  net_peerCount: () => toHex(20 + Math.floor(Math.random() * 40)),

  eth_chainId: (_p, _s, c) => c.chainId,
  eth_blockNumber: (_p, s) => toHex(s.blockHeight),
  eth_gasPrice: () => toHex(20_000_000_000 + Math.floor(Math.random() * 5_000_000_000)),
  eth_maxPriorityFeePerGas: () => toHex(1_500_000_000 + Math.floor(Math.random() * 500_000_000)),
  eth_feeHistory: (p) => {
    const blockCount = typeof p[0] === 'string' ? parseInt(p[0], 16) : Number(p[0] ?? 4);
    const count = Math.max(1, Math.min(blockCount || 4, 32));
    return {
      oldestBlock: toHex(1_000_000),
      reward: Array.from({ length: count }, () => [toHex(1_000_000_000), toHex(2_000_000_000)]),
      baseFeePerGas: Array.from({ length: count + 1 }, () => toHex(15_000_000_000)),
      gasUsedRatio: Array.from({ length: count }, () => Math.random())
    };
  },

  eth_getBalance: () => toHex(BigInt(Math.floor(Math.random() * 1e6)) * 10n ** 18n),

  eth_getBlockByNumber: (p, s) => {
    const tag = p[0];
    const num =
      tag === 'latest' || tag === 'pending' || tag === 'safe' || tag === 'finalized'
        ? toHex(s.blockHeight)
        : typeof tag === 'string'
          ? tag
          : toHex(s.blockHeight);
    return buildBlock(num);
  },
  eth_getBlockByHash: (_p, s) => buildBlock(toHex(s.blockHeight)),
  eth_getTransactionByHash: () => buildTx(),
  eth_getTransactionReceipt: () => buildReceipt(),
  eth_getLogs: () => [],

  eth_call: () => '0x',
  eth_estimateGas: () => toHex(21_000 + Math.floor(Math.random() * 100_000)),
  eth_sendRawTransaction: () => randomHex(32)
};

/** Process a single JSON-RPC request. Always returns a JsonRpcResponse. */
export function handleRpc(req: JsonRpcRequest, state: NodeState, cfg: EvmConfig): JsonRpcResponse {
  const id = req.id ?? null;
  const method = req.method ?? '';
  const handler = HANDLERS[method];
  if (!handler) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    };
  }
  try {
    const result = handler(paramsArray(req.params), state, cfg);
    return { jsonrpc: '2.0', id, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: `Internal error: ${message}` }
    };
  }
}

/** Methods this dispatcher knows about. Useful for tests + introspection. */
export const SUPPORTED_METHODS = Object.freeze(Object.keys(HANDLERS));

/** Random uint helper re-exported for downstream nodes. */
export { randomHex, randomHexInt, toHex };
