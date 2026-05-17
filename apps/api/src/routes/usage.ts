import type { FastifyInstance } from 'fastify';
import { computeUsage } from '../usage.js';
import type { Store } from '../store.js';

export function registerUsageRoute(app: FastifyInstance, store: Store): void {
  app.get('/v1/usage', async () => computeUsage(store.rpcLog));
}
