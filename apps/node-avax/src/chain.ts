import type { EvmServerConfig } from '@qnc/mock-evm';

export const AVAX_CONFIG: EvmServerConfig = {
  chain: 'avax',
  ticker: 'AVAX',
  chainId: '0xa86a',
  clientVersion: 'avalanchego/v1.11.5-qnc-mock',
  netVersion: '43114',
  port: Number(process.env.PORT ?? 8502),
  tickMs: 2_000,
  initialHeight: 50_000_000
};
