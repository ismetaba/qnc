import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BillingPage } from './Billing.js';

const FAKE_USAGE = {
  totalRequests: 12_345_678,
  errorRate: 0.005,
  byChain: { eth: 5_000_000, avax: 4_345_678, btc: 3_000_000 },
  monthToDate: {
    requests: 90_000_000,
    included: 80_000_000,
    overage: 10_000_000,
    estimatedCostUsd: 299
  }
};

const FAKE_INVOICES = Array.from({ length: 6 }, (_, i) => ({
  id: `inv_${i}`,
  periodStart: new Date(2026, i, 1).toISOString(),
  periodEnd: new Date(2026, i + 1, 0).toISOString(),
  requests: 70_000_000,
  amountUsd: 49,
  status: i === 0 ? 'open' : i === 1 ? 'past_due' : 'paid'
}));

function fakeFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.endsWith('/v1/usage')
      ? FAKE_USAGE
      : url.endsWith('/v1/billing/invoices')
        ? FAKE_INVOICES
        : {};
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as unknown as typeof fetch;
}

describe('<BillingPage/>', () => {
  let original: typeof fetch;
  beforeEach(() => {
    original = globalThis.fetch;
    globalThis.fetch = fakeFetch();
  });
  afterEach(() => {
    globalThis.fetch = original;
  });

  it('renders MTD card, progress bar, and 6 invoices', async () => {
    render(<BillingPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('invoice-row').length).toBe(6);
    });
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    // Estimated cost
    expect(screen.getByText('$299.00')).toBeInTheDocument();
    // Progress fill clamped to 100% even though requests > included
    expect(screen.getByTestId('progress-fill').style.width).toBe('100%');
  });
});
