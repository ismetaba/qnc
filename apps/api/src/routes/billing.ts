import type { FastifyInstance } from 'fastify';
import type { Store } from '../store.js';

export function registerBillingRoutes(app: FastifyInstance, store: Store): void {
  app.get('/v1/billing/invoices', async () => store.invoices);
}
