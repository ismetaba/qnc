/** All chains supported by the mock fleet. */
export type Chain = 'eth' | 'avax' | 'btc';

/** All RBAC roles in the demo workspace. */
export type Role = 'admin' | 'developer' | 'billing' | 'viewer';

/** Sidebar navigation slugs. */
export type NavItem =
  | 'overview'
  | 'endpoints'
  | 'rpc'
  | 'metrics'
  | 'nodes'
  | 'users'
  | 'billing'
  | 'settings';

export interface Endpoint {
  id: string;
  name: string;
  chain: Chain;
  createdAt: string;
  token: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export type NodeStatus = 'healthy' | 'lagging' | 'down';

export interface NodeHealth {
  chain: Chain;
  status: NodeStatus;
  blockHeight: number;
  peers: number;
  latencyMs: number;
  syncProgress: number;
  diskGB: number;
  versionText: string;
  uptimeS: number;
}

export interface RpcLogEntry {
  ts: number;
  endpointId: string;
  chain: Chain;
  method: string;
  durationMs: number;
  ok: boolean;
  error?: string;
}

export interface MetricByMethod {
  method: string;
  count: number;
  errors: number;
}

export interface MetricSnapshot {
  endpointId: string;
  windowMs: number;
  requestCount: number;
  errorCount: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  byMethod: MetricByMethod[];
}

export interface UsageSummary {
  totalRequests: number;
  errorRate: number;
  byChain: Record<Chain, number>;
  monthToDate: {
    requests: number;
    included: number;
    overage: number;
    estimatedCostUsd: number;
  };
}

export type InvoiceStatus = 'paid' | 'open' | 'past_due';

export interface InvoiceLine {
  id: string;
  periodStart: string;
  periodEnd: string;
  requests: number;
  amountUsd: number;
  status: InvoiceStatus;
}

/** Plan constants. */
export const PLAN = {
  name: 'Discovery',
  baseUsd: 49,
  includedRequests: 80_000_000,
  overageUsdPerMillion: 25
} as const;
