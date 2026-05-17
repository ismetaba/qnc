import { describe, it, expect } from 'vitest';
import { percentile, computeMetrics } from './metrics.js';
import type { RpcLogEntry } from '@qnc/shared';

describe('percentile', () => {
  it('returns 0 for empty input', () => {
    expect(percentile([], 0.5)).toBe(0);
  });

  it('p50/p95/p99 on 1..100', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i + 1);
    // nearest-rank index = floor(p * len) → p50→idx50→51, p95→idx95→96, p99→idx99→100
    expect(percentile(arr, 0.5)).toBe(51);
    expect(percentile(arr, 0.95)).toBe(96);
    expect(percentile(arr, 0.99)).toBe(100);
  });

  it('clamps p out of bounds', () => {
    const arr = [10, 20, 30];
    expect(percentile(arr, -1)).toBe(10);
    expect(percentile(arr, 2)).toBe(30);
  });
});

describe('computeMetrics', () => {
  const now = 1_700_000_000_000;
  const log: RpcLogEntry[] = [
    { ts: now - 500, endpointId: 'A', chain: 'eth', method: 'eth_blockNumber', durationMs: 5, ok: true },
    { ts: now - 400, endpointId: 'A', chain: 'eth', method: 'eth_blockNumber', durationMs: 8, ok: true },
    { ts: now - 300, endpointId: 'A', chain: 'eth', method: 'eth_chainId', durationMs: 3, ok: false, error: 'x' },
    { ts: now - 99_000, endpointId: 'A', chain: 'eth', method: 'eth_blockNumber', durationMs: 999, ok: true },
    { ts: now - 200, endpointId: 'B', chain: 'btc', method: 'getblockcount', durationMs: 12, ok: true }
  ];

  it('filters by endpoint + window and computes counts/percentiles', () => {
    const m = computeMetrics(log, 'A', 1_000, now);
    expect(m.endpointId).toBe('A');
    expect(m.requestCount).toBe(3);
    expect(m.errorCount).toBe(1);
    expect(m.byMethod.find((x) => x.method === 'eth_blockNumber')?.count).toBe(2);
    expect(m.byMethod.find((x) => x.method === 'eth_chainId')?.count).toBe(1);
    expect(m.latencyP50).toBeGreaterThan(0);
  });

  it('returns zeroed snapshot when no entries match', () => {
    const m = computeMetrics(log, 'nope', 1_000, now);
    expect(m.requestCount).toBe(0);
    expect(m.errorCount).toBe(0);
    expect(m.byMethod).toEqual([]);
    expect(m.latencyP50).toBe(0);
  });
});
