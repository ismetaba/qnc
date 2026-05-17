import type { FastifyInstance } from 'fastify';
import { computeMetrics } from '../metrics.js';
import type { Store } from '../store.js';

export function registerMetricsRoute(app: FastifyInstance, store: Store): void {
  app.get<{ Querystring: { endpointId?: string; windowMs?: string } }>(
    '/v1/metrics',
    async (req, reply) => {
      const endpointId = req.query.endpointId;
      if (!endpointId) {
        reply.code(400);
        return { error: 'endpointId is required' };
      }
      const windowMs = Number(req.query.windowMs ?? 60_000);
      if (!Number.isFinite(windowMs) || windowMs <= 0) {
        reply.code(400);
        return { error: 'windowMs must be a positive number' };
      }
      return computeMetrics(store.rpcLog, endpointId, windowMs);
    }
  );
}
