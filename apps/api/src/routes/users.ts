import type { FastifyInstance } from 'fastify';
import type { Store } from '../store.js';

export function registerUsersRoute(app: FastifyInstance, store: Store): void {
  app.get('/v1/users', async () => store.users);
}
