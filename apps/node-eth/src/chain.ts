import type { EvmServerConfig } from '@qnc/mock-evm';

export const ETH_CONFIG: EvmServerConfig = {
  chain: 'eth',
  ticker: 'ETH',
  chainId: '0x1',
  clientVersion: 'Geth/v1.13.14-stable-qnc-mock/linux-amd64/go1.22.1',
  netVersion: '1',
  port: Number(process.env.PORT ?? 8501),
  tickMs: 12_000,
  initialHeight: 19_500_000
};
