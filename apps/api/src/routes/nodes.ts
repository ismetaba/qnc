import type { FastifyInstance } from 'fastify';
import { fetchNodeHealth, type FetchNodesOptions } from '../nodes.js';

export function registerNodesRoute(app: FastifyInstance, opts: FetchNodesOptions = {}): void {
  app.get('/v1/nodes', async () => fetchNodeHealth(opts));
}
