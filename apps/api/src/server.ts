import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { createStore, type Store } from './store.js';
import { registerHealthRoute } from './routes/health.js';
import { registerUsersRoute } from './routes/users.js';
import { registerEndpointRoutes } from './routes/endpoints.js';
import { registerBillingRoutes } from './routes/billing.js';
import { registerRpcRoute, type RpcRouteOptions } from './routes/rpc.js';
import { registerMetricsRoute } from './routes/metrics.js';
import { registerLogsRoute } from './routes/logs.js';
import { registerUsageRoute } from './routes/usage.js';
import { registerNodesRoute } from './routes/nodes.js';
import type { FetchNodesOptions } from './nodes.js';

export interface BuildOptions {
  /** Pre-existing store (e.g. for tests). If omitted, a fresh seeded store is created. */
  store?: Store;
  /** Enable pretty-pino logging. Off by default for tests. */
  prettyLogs?: boolean;
  /** Override fetch + timeout for the proxy route (testing). */
  rpc?: RpcRouteOptions;
  /** Override fetch + timeout for the nodes route (testing). */
  nodes?: FetchNodesOptions;
}

export async function buildApi(opts: BuildOptions = {}): Promise<{ app: FastifyInstance; store: Store }> {
  const store = opts.store ?? createStore();
  const app = Fastify({
    logger: opts.prettyLogs
      ? {
          level: 'info',
          transport: { target: 'pino-pretty', options: { colorize: true } }
        }
      : false
  });

  await app.register(cors, { origin: true });

  registerHealthRoute(app);
  registerUsersRoute(app, store);
  registerEndpointRoutes(app, store);
  registerBillingRoutes(app, store);
  registerRpcRoute(app, store, opts.rpc ?? {});
  registerMetricsRoute(app, store);
  registerLogsRoute(app, store);
  registerUsageRoute(app, store);
  registerNodesRoute(app, opts.nodes ?? {});

  return { app, store };
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  const port = Number(process.env.PORT ?? 4000);
  const { app } = await buildApi({ prettyLogs: true });
  app
    .listen({ port, host: '0.0.0.0' })
    .then((addr) => {
      // eslint-disable-next-line no-console
      console.log(`[api] listening on ${addr}`);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[api] failed to start', err);
      process.exit(1);
    });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[api] received ${signal}, shutting down`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
