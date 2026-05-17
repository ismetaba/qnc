import { randomBytes } from 'node:crypto';
import type { BtcNodeState } from './state.js';

export interface BtcJsonRpcRequest {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: unknown;
}

export type BtcJsonRpcResponse =
  | { jsonrpc: '2.0'; id: number | string | null; result: unknown }
  | { jsonrpc: '2.0'; id: number | string | null; error: { code: number; message: string } };

type Handler = (params: unknown[], state: BtcNodeState) => unknown;

function randomHex(byteLen: number): string {
  return randomBytes(byteLen).toString('hex');
}

function paramsArray(p: unknown): unknown[] {
  return Array.isArray(p) ? p : [];
}

function buildBlockHash(): string {
  // BTC block hashes are 64 hex chars and start with leading zeros — synthesize that look.
  // 19 leading zeros + 45 random hex chars = 64 chars total.
  return '0000000000000000000' + randomHex(23).slice(0, 45);
}

function buildBlock(height: number): Record<string, unknown> {
  return {
    hash: buildBlockHash(),
    confirmations: 1,
    size: 1_300_000 + Math.floor(Math.random() * 100_000),
    strippedsize: 1_100_000,
    weight: 3_993_000,
    height,
    version: 0x20000000,
    versionHex: '20000000',
    merkleroot: randomHex(32),
    tx: Array.from({ length: 5 }, () => randomHex(32)),
    time: Math.floor(Date.now() / 1000),
    mediantime: Math.floor(Date.now() / 1000) - 600,
    nonce: Math.floor(Math.random() * 0xffffffff),
    bits: '17034219',
    difficulty: 79_500_000_000_000,
    chainwork: randomHex(32),
    nTx: 5,
    previousblockhash: buildBlockHash()
  };
}

const HANDLERS: Record<string, Handler> = {
  getblockcount: (_p, s) => s.blockHeight,
  getbestblockhash: () => buildBlockHash(),
  getblockchaininfo: (_p, s) => ({
    chain: 'main',
    blocks: s.blockHeight,
    headers: s.blockHeight,
    bestblockhash: buildBlockHash(),
    difficulty: 79_500_000_000_000,
    mediantime: Math.floor(Date.now() / 1000) - 600,
    verificationprogress: 0.9999987,
    initialblockdownload: false,
    chainwork: randomHex(32),
    size_on_disk: 615_000_000_000,
    pruned: false,
    warnings: ''
  }),
  getnetworkinfo: () => ({
    version: 260000,
    subversion: '/Satoshi:26.0.0/',
    protocolversion: 70016,
    localservices: '0000000000000409',
    localrelay: true,
    timeoffset: 0,
    networkactive: true,
    connections: 8 + Math.floor(Math.random() * 8),
    connections_in: 4,
    connections_out: 8,
    networks: [],
    relayfee: 0.00001,
    incrementalfee: 0.00001,
    localaddresses: [],
    warnings: ''
  }),
  getmempoolinfo: () => ({
    loaded: true,
    size: 18_000 + Math.floor(Math.random() * 4_000),
    bytes: 9_500_000,
    usage: 38_000_000,
    total_fee: 0.42,
    maxmempool: 300_000_000,
    mempoolminfee: 0.00001,
    minrelaytxfee: 0.00001,
    incrementalrelayfee: 0.00001,
    unbroadcastcount: 0,
    fullrbf: false
  }),
  getblockhash: (p, s) => {
    const h = typeof p[0] === 'number' ? p[0] : s.blockHeight;
    void h;
    return buildBlockHash();
  },
  getblock: (_p, s) => buildBlock(s.blockHeight),
  getrawtransaction: () => ({
    txid: randomHex(32),
    hash: randomHex(32),
    version: 2,
    size: 250,
    vsize: 141,
    weight: 562,
    locktime: 0,
    vin: [{ txid: randomHex(32), vout: 0, scriptSig: { asm: '', hex: '' }, sequence: 4294967295 }],
    vout: [{ value: 0.5, n: 0, scriptPubKey: { asm: '', hex: '', type: 'witness_v0_keyhash', address: 'bc1qexample' } }],
    hex: randomHex(150)
  }),
  getbalance: () => 0.0,
  estimatesmartfee: (p) => {
    const conf = typeof p[0] === 'number' ? p[0] : 6;
    const feeRate = 0.00002 + Math.random() * 0.00003;
    return { feerate: Number(feeRate.toFixed(8)), blocks: conf };
  },
  getmininginfo: (_p, s) => ({
    blocks: s.blockHeight,
    currentblockweight: 3_993_000,
    currentblocktx: 5,
    difficulty: 79_500_000_000_000,
    networkhashps: 6.2e20,
    pooledtx: 18_000,
    chain: 'main',
    warnings: ''
  }),
  getpeerinfo: () =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      addr: `203.0.113.${10 + i}:8333`,
      services: '0000000000000409',
      relaytxes: true,
      lastsend: Math.floor(Date.now() / 1000),
      lastrecv: Math.floor(Date.now() / 1000),
      bytessent: 1_000_000,
      bytesrecv: 1_500_000,
      conntime: Math.floor(Date.now() / 1000) - 3_600,
      pingtime: 0.05,
      version: 70016,
      subver: '/Satoshi:26.0.0/',
      inbound: false,
      startingheight: 800_000,
      synced_headers: 800_000,
      synced_blocks: 800_000
    }))
};

export const SUPPORTED_BTC_METHODS = Object.freeze(Object.keys(HANDLERS));

export function handleBtcRpc(req: BtcJsonRpcRequest, state: BtcNodeState): BtcJsonRpcResponse {
  const id = req.id ?? null;
  const method = req.method ?? '';
  const handler = HANDLERS[method];
  if (!handler) {
    return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
  try {
    const result = handler(paramsArray(req.params), state);
    return { jsonrpc: '2.0', id, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { jsonrpc: '2.0', id, error: { code: -32603, message: `Internal error: ${message}` } };
  }
}
