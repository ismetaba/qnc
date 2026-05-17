import type { FastifyInstance } from 'fastify';
import type { Store } from '../store.js';

export function registerLogsRoute(app: FastifyInstance, store: Store): void {
  app.get<{ Querystring: { endpointId?: string; limit?: string } }>(
    '/v1/logs',
    async (req) => {
      const endpointId = req.query.endpointId;
      const limit = Math.max(1, Math.min(2000, Number(req.query.limit ?? 100)));
      const filtered = endpointId
        ? store.rpcLog.filter((e) => e.endpointId === endpointId)
        : store.rpcLog;
      // Reverse-chronological slice.
      return filtered.slice(-limit).reverse();
    }
  );
}
