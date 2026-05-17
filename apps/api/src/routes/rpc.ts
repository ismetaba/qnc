import type { FastifyInstance } from 'fastify';
import { forward, type ForwardOptions } from '../proxy.js';
import type { Store } from '../store.js';

export interface RpcRouteOptions {
  forwardOpts?: ForwardOptions;
}

export function registerRpcRoute(
  app: FastifyInstance,
  store: Store,
  opts: RpcRouteOptions = {}
): void {
  app.post<{ Params: { endpointId: string } }>('/v1/rpc/:endpointId', async (req, reply) => {
    const endpoint = store.endpoints.find((e) => e.id === req.params.endpointId);
    if (!endpoint) {
      reply.code(404);
      return { error: 'endpoint not found' };
    }
    const result = await forward(store, endpoint, req.body, opts.forwardOpts);
    reply.code(result.status >= 200 && result.status < 600 ? result.status : 200);
    return result.body;
  });
}
