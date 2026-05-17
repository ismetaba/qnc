import type { Chain, Endpoint, RpcLogEntry } from '@qnc/shared';
import { pushLog, type Store } from './store.js';

export const NODE_URL: Record<Chain, string> = {
  eth: process.env.QNC_NODE_ETH_URL ?? 'http://127.0.0.1:8501',
  avax: process.env.QNC_NODE_AVAX_URL ?? 'http://127.0.0.1:8502',
  btc: process.env.QNC_NODE_BTC_URL ?? 'http://127.0.0.1:8503'
};

interface RpcBody {
  method?: unknown;
  id?: unknown;
  params?: unknown;
  jsonrpc?: unknown;
}

export interface ProxyResult {
  status: number;
  body: unknown;
  log: RpcLogEntry;
}

export interface ForwardOptions {
  /** Override fetch for tests. Defaults to globalThis.fetch. */
  fetchImpl?: typeof fetch;
  /** Timeout ms for the upstream call. */
  timeoutMs?: number;
}

function pickMethod(body: unknown): string {
  if (body && typeof body === 'object' && 'method' in body) {
    const m = (body as RpcBody).method;
    if (typeof m === 'string') return m;
  }
  return 'unknown';
}

function isJsonRpcError(body: unknown): { code: number; message: string } | null {
  if (body && typeof body === 'object' && 'error' in body) {
    const err = (body as { error?: unknown }).error;
    if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
      return {
        code: Number((err as { code: unknown }).code),
        message: String((err as { message: unknown }).message)
      };
    }
  }
  return null;
}

/** Forward a JSON-RPC body to the right mock node, record it in rpcLog. */
export async function forward(
  store: Store,
  endpoint: Endpoint,
  body: unknown,
  opts: ForwardOptions = {}
): Promise<ProxyResult> {
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? 5_000;
  const url = NODE_URL[endpoint.chain];
  const method = pickMethod(body);
  const ts = Date.now();
  const start = performance.now();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let status = 0;
  let responseBody: unknown = null;
  let ok = true;
  let error: string | undefined;

  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: ctrl.signal
    });
    status = res.status;
    try {
      responseBody = await res.json();
    } catch {
      responseBody = null;
    }
    const rpcErr = isJsonRpcError(responseBody);
    if (rpcErr) {
      ok = false;
      error = `${rpcErr.code}: ${rpcErr.message}`;
    }
    if (!res.ok) {
      ok = false;
      error = error ?? `upstream HTTP ${res.status}`;
    }
  } catch (err) {
    ok = false;
    status = 502;
    error = err instanceof Error ? err.message : String(err);
    responseBody = { jsonrpc: '2.0', id: null, error: { code: -32000, message: error } };
  } finally {
    clearTimeout(timer);
  }

  const durationMs = Math.max(0, performance.now() - start);
  const log: RpcLogEntry = {
    ts,
    endpointId: endpoint.id,
    chain: endpoint.chain,
    method,
    durationMs,
    ok,
    ...(error ? { error } : {})
  };
  pushLog(store, log);

  return { status: status || 200, body: responseBody, log };
}
