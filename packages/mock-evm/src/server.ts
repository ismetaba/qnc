import Fastify, { type FastifyInstance } from 'fastify';
import type { EvmConfig, JsonRpcRequest } from './evmRpc.js';
import { handleRpc } from './evmRpc.js';
import { createState, type NodeState } from './state.js';

export interface EvmServerConfig extends EvmConfig {
  port: number;
  /** Block-time in ms; the height auto-increments at this cadence. */
  tickMs: number;
  /** Initial block height (default 1_000_000 + chain-specific offset). */
  initialHeight?: number;
}

export interface EvmServerHandle {
  app: FastifyInstance;
  state: NodeState;
  start: () => Promise<string>;
  stop: () => Promise<void>;
}

/** Build (but do not start) a Fastify EVM mock-node server. Does not own the tick timer. */
export function buildEvmServer(cfg: EvmServerConfig): { app: FastifyInstance; state: NodeState } {
  const state = createState(cfg.initialHeight ?? 1_000_000);
  const app = Fastify({ logger: false });

  // CORS for every response.
  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('access-control-allow-origin', '*');
    reply.header('access-control-allow-headers', 'content-type');
    reply.header('access-control-allow-methods', 'GET,POST,OPTIONS');
    return payload;
  });

  app.options('/', async (_req, reply) => {
    reply.code(204);
    return null;
  });

  app.get('/', async () => ({
    chain: cfg.chain,
    ticker: cfg.ticker,
    blockHeight: state.blockHeight,
    uptimeS: state.uptimeS()
  }));

  app.post('/', async (req) => {
    const body = (req.body ?? {}) as JsonRpcRequest | JsonRpcRequest[];
    if (Array.isArray(body)) {
      return body.map((r) => handleRpc(r, state, cfg));
    }
    return handleRpc(body, state, cfg);
  });

  return { app, state };
}

/** Build, start, and own the tick timer. */
export function createEvmServer(cfg: EvmServerConfig): EvmServerHandle {
  const { app, state } = buildEvmServer(cfg);
  let timer: NodeJS.Timeout | null = null;

  const start = async () => {
    timer = setInterval(() => {
      state.blockHeight += 1;
    }, cfg.tickMs);
    if (typeof timer.unref === 'function') timer.unref();
    return app.listen({ port: cfg.port, host: '0.0.0.0' });
  };

  const stop = async () => {
    if (timer) clearInterval(timer);
    await app.close();
  };

  return { app, state, start, stop };
}
