import Fastify, { type FastifyInstance } from 'fastify';
import { handleBtcRpc, type BtcJsonRpcRequest } from './btcRpc.js';
import { createBtcState, type BtcNodeState } from './state.js';

export interface BtcServerConfig {
  port: number;
  tickMs: number;
  initialHeight: number;
}

export const BTC_CONFIG: BtcServerConfig = {
  port: Number(process.env.PORT ?? 8503),
  tickMs: 600_000,
  initialHeight: 850_000
};

export function buildBtcServer(cfg: BtcServerConfig): { app: FastifyInstance; state: BtcNodeState } {
  const state = createBtcState(cfg.initialHeight);
  const app = Fastify({ logger: false });

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
    chain: 'btc' as const,
    ticker: 'BTC' as const,
    blockHeight: state.blockHeight,
    uptimeS: state.uptimeS()
  }));

  app.post('/', async (req) => {
    const body = (req.body ?? {}) as BtcJsonRpcRequest | BtcJsonRpcRequest[];
    if (Array.isArray(body)) return body.map((r) => handleBtcRpc(r, state));
    return handleBtcRpc(body, state);
  });

  return { app, state };
}

export function createBtcServer(cfg: BtcServerConfig) {
  const { app, state } = buildBtcServer(cfg);
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

// Bootstrap when run directly.
const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  const node = createBtcServer(BTC_CONFIG);
  node
    .start()
    .then((addr) => {
      // eslint-disable-next-line no-console
      console.log(`[node-btc] listening on ${addr} (chain=btc, tick=${BTC_CONFIG.tickMs}ms)`);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[node-btc] failed to start', err);
      process.exit(1);
    });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[node-btc] received ${signal}, shutting down`);
    await node.stop();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
