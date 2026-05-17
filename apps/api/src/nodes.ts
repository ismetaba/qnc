import type { Chain, NodeHealth } from '@qnc/shared';
import { NODE_URL } from './proxy.js';

const VERSION_BY_CHAIN: Record<Chain, string> = {
  eth: 'geth/v1.13.14-stable',
  avax: 'avalanchego/v1.11.5',
  btc: 'bitcoind/v26.0.0'
};

const DISK_GB_BY_CHAIN: Record<Chain, number> = {
  eth: 1180,
  avax: 540,
  btc: 615
};

const PEERS_BY_CHAIN: Record<Chain, number> = {
  eth: 50,
  avax: 32,
  btc: 14
};

interface NodeStatusBody {
  chain: Chain;
  ticker: string;
  blockHeight: number;
  uptimeS: number;
}

export interface FetchNodesOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Override map for tests. */
  nodeUrl?: Partial<Record<Chain, string>>;
}

async function fetchOne(
  chain: Chain,
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number
): Promise<NodeHealth> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal });
    const elapsed = performance.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as NodeStatusBody;
    return {
      chain,
      status: 'healthy',
      blockHeight: Number(body.blockHeight ?? 0),
      peers: PEERS_BY_CHAIN[chain],
      latencyMs: Math.round(elapsed * 100) / 100,
      syncProgress: 1,
      diskGB: DISK_GB_BY_CHAIN[chain],
      versionText: VERSION_BY_CHAIN[chain],
      uptimeS: Number(body.uptimeS ?? 0)
    };
  } catch {
    return {
      chain,
      status: 'down',
      blockHeight: 0,
      peers: 0,
      latencyMs: 0,
      syncProgress: 0,
      diskGB: DISK_GB_BY_CHAIN[chain],
      versionText: VERSION_BY_CHAIN[chain],
      uptimeS: 0
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchNodeHealth(opts: FetchNodesOptions = {}): Promise<NodeHealth[]> {
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? 1_500;
  const map: Record<Chain, string> = { ...NODE_URL, ...opts.nodeUrl };
  const chains: Chain[] = ['eth', 'avax', 'btc'];
  return Promise.all(chains.map((c) => fetchOne(c, map[c], fetchImpl, timeoutMs)));
}
