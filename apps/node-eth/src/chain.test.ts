import { describe, it, expect } from 'vitest';
import { ETH_CONFIG } from './chain.js';

describe('node-eth chain config', () => {
  it('declares the correct chain identity', () => {
    expect(ETH_CONFIG.chain).toBe('eth');
    expect(ETH_CONFIG.ticker).toBe('ETH');
    expect(ETH_CONFIG.chainId).toBe('0x1');
  });

  it('uses port 8501 (or PORT override) and a 12 000 ms tick', () => {
    expect(ETH_CONFIG.port).toBe(Number(process.env.PORT ?? 8501));
    expect(ETH_CONFIG.tickMs).toBe(12_000);
  });

  it('declares an initial block height + a client version string', () => {
    expect(ETH_CONFIG.initialHeight).toBeGreaterThan(0);
    expect(ETH_CONFIG.clientVersion).toMatch(/^Geth\//);
  });
});
