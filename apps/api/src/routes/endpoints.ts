import type { FastifyInstance } from 'fastify';
import type { Chain } from '@qnc/shared';
import { buildEndpoint, type Store } from '../store.js';

const VALID_CHAINS: ReadonlySet<Chain> = new Set(['eth', 'avax', 'btc']);

interface CreateBody {
  name?: unknown;
  chain?: unknown;
}

function isChain(v: unknown): v is Chain {
  return typeof v === 'string' && VALID_CHAINS.has(v as Chain);
}

export function registerEndpointRoutes(app: FastifyInstance, store: Store): void {
  app.get('/v1/endpoints', async () => store.endpoints);

  app.post('/v1/endpoints', async (req, reply) => {
    const body = (req.body ?? {}) as CreateBody;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const chain = body.chain;
    if (!name) {
      reply.code(400);
      return { error: 'name is required' };
    }
    if (!isChain(chain)) {
      reply.code(400);
      return { error: `chain must be one of ${[...VALID_CHAINS].join(', ')}` };
    }
    const endpoint = buildEndpoint(name, chain);
    store.endpoints.push(endpoint);
    reply.code(201);
    return endpoint;
  });

  app.delete<{ Params: { id: string } }>('/v1/endpoints/:id', async (req, reply) => {
    const idx = store.endpoints.findIndex((e) => e.id === req.params.id);
    if (idx === -1) {
      reply.code(404);
      return { error: 'not found' };
    }
    const [removed] = store.endpoints.splice(idx, 1);
    return { removed };
  });
}
