import type {
  Endpoint,
  InvoiceLine,
  MetricSnapshot,
  NodeHealth,
  RpcLogEntry,
  UsageSummary,
  User,
  Chain
} from '@qnc/shared';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) }
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text();
    }
    throw new Error(`API ${path} failed ${res.status}: ${detail}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),
  users: () => request<User[]>('/v1/users'),

  endpoints: {
    list: () => request<Endpoint[]>('/v1/endpoints'),
    create: (body: { name: string; chain: Chain }) =>
      request<Endpoint>('/v1/endpoints', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id: string) =>
      request<{ removed: Endpoint }>(`/v1/endpoints/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  rpc: <T = unknown>(endpointId: string, body: unknown) =>
    request<T>(`/v1/rpc/${encodeURIComponent(endpointId)}`, {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  metrics: (endpointId: string, windowMs: number) =>
    request<MetricSnapshot>(
      `/v1/metrics?endpointId=${encodeURIComponent(endpointId)}&windowMs=${windowMs}`
    ),

  logs: (endpointId?: string, limit = 100) => {
    const params = new URLSearchParams();
    if (endpointId) params.set('endpointId', endpointId);
    params.set('limit', String(limit));
    return request<RpcLogEntry[]>(`/v1/logs?${params.toString()}`);
  },

  usage: () => request<UsageSummary>('/v1/usage'),
  nodes: () => request<NodeHealth[]>('/v1/nodes'),
  invoices: () => request<InvoiceLine[]>('/v1/billing/invoices')
};
