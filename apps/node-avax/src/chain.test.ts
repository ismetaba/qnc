import { describe, it, expect } from 'vitest';
import { AVAX_CONFIG } from './chain.js';

describe('node-avax chain config', () => {
  it('declares the correct chain identity', () => {
    expect(AVAX_CONFIG.chain).toBe('avax');
    expect(AVAX_CONFIG.ticker).toBe('AVAX');
    expect(AVAX_CONFIG.chainId).toBe('0xa86a');
  });

  it('uses port 8502 (or PORT override) and a 2 000 ms tick', () => {
    expect(AVAX_CONFIG.port).toBe(Number(process.env.PORT ?? 8502));
    expect(AVAX_CONFIG.tickMs).toBe(2_000);
  });

  it('declares an initial block height + an avalanchego client version string', () => {
    expect(AVAX_CONFIG.initialHeight).toBeGreaterThan(0);
    expect(AVAX_CONFIG.clientVersion).toMatch(/^avalanchego\//);
  });
});
