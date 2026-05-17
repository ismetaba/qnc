import { nanoid } from 'nanoid';
import type {
  Chain,
  Endpoint,
  InvoiceLine,
  RpcLogEntry,
  User
} from '@qnc/shared';

export const RPC_LOG_CAP = 2000;

export interface Store {
  endpoints: Endpoint[];
  rpcLog: RpcLogEntry[];
  readonly users: ReadonlyArray<User>;
  readonly invoices: ReadonlyArray<InvoiceLine>;
  readonly serverStartedAt: number;
}

function makeToken(): string {
  return 'qnc_' + nanoid(20);
}

/** Build a brand-new endpoint suitable for insertion or seeding. */
export function buildEndpoint(name: string, chain: Chain): Endpoint {
  return {
    id: nanoid(12),
    name,
    chain,
    createdAt: new Date().toISOString(),
    token: makeToken()
  };
}

const SEEDED_USERS: ReadonlyArray<User> = Object.freeze([
  { id: 'u_admin', name: 'Ada Admin', email: 'ada@qnc.demo', role: 'admin' },
  { id: 'u_dev', name: 'Devon Dev', email: 'devon@qnc.demo', role: 'developer' },
  { id: 'u_bill', name: 'Billie Books', email: 'billie@qnc.demo', role: 'billing' },
  { id: 'u_view', name: 'Vera Viewer', email: 'vera@qnc.demo', role: 'viewer' }
]);

function seedInvoices(): ReadonlyArray<InvoiceLine> {
  const out: InvoiceLine[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const requests = 60_000_000 + Math.floor(Math.random() * 40_000_000);
    const overage = Math.max(0, requests - 80_000_000);
    const amount = Math.round((49 + (overage / 1_000_000) * 25) * 100) / 100;
    const status: InvoiceLine['status'] = i === 0 ? 'open' : i === 1 ? 'past_due' : 'paid';
    out.push({
      id: `inv_${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}`,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      requests,
      amountUsd: amount,
      status
    });
  }
  return Object.freeze(out);
}

export function createStore(): Store {
  return {
    endpoints: [
      buildEndpoint('eth-mainnet-prod', 'eth'),
      buildEndpoint('avax-cchain-prod', 'avax'),
      buildEndpoint('btc-mainnet-prod', 'btc')
    ],
    rpcLog: [],
    users: SEEDED_USERS,
    invoices: seedInvoices(),
    serverStartedAt: Date.now()
  };
}

/** Append a log entry to the circular buffer, slicing to RPC_LOG_CAP. */
export function pushLog(store: Store, entry: RpcLogEntry): void {
  store.rpcLog.push(entry);
  if (store.rpcLog.length > RPC_LOG_CAP) {
    store.rpcLog.splice(0, store.rpcLog.length - RPC_LOG_CAP);
  }
}
