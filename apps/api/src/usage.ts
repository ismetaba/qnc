import type { Chain, RpcLogEntry, UsageSummary } from '@qnc/shared';
import { PLAN } from '@qnc/shared';

export function startOfMonth(now: Date = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export function computeUsage(log: ReadonlyArray<RpcLogEntry>, now: Date = new Date()): UsageSummary {
  const total = log.length;
  const errors = log.filter((e) => !e.ok).length;
  const byChain: Record<Chain, number> = { eth: 0, avax: 0, btc: 0 };
  for (const e of log) byChain[e.chain] += 1;

  const monthStart = startOfMonth(now);
  const monthRequests = log.filter((e) => e.ts >= monthStart).length;
  const overage = Math.max(0, monthRequests - PLAN.includedRequests);
  const estimatedCostUsd =
    Math.round((PLAN.baseUsd + (overage / 1_000_000) * PLAN.overageUsdPerMillion) * 100) / 100;

  return {
    totalRequests: total,
    errorRate: total === 0 ? 0 : errors / total,
    byChain,
    monthToDate: {
      requests: monthRequests,
      included: PLAN.includedRequests,
      overage,
      estimatedCostUsd
    }
  };
}
