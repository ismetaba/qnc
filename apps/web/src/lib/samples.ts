import type { Chain } from '@qnc/shared';

export interface SampleChip {
  label: string;
  method: string;
  params: unknown[];
}

const EVM_SAMPLES: SampleChip[] = [
  { label: 'eth_blockNumber', method: 'eth_blockNumber', params: [] },
  { label: 'eth_chainId', method: 'eth_chainId', params: [] },
  {
    label: 'eth_getBalance',
    method: 'eth_getBalance',
    params: ['0x0000000000000000000000000000000000000000', 'latest']
  },
  { label: 'eth_gasPrice', method: 'eth_gasPrice', params: [] },
  { label: 'eth_feeHistory', method: 'eth_feeHistory', params: ['0x4', 'latest', [25, 50, 75]] }
];

const BTC_SAMPLES: SampleChip[] = [
  { label: 'getblockcount', method: 'getblockcount', params: [] },
  { label: 'getblockchaininfo', method: 'getblockchaininfo', params: [] },
  { label: 'getnetworkinfo', method: 'getnetworkinfo', params: [] },
  { label: 'estimatesmartfee', method: 'estimatesmartfee', params: [6] }
];

export function samplesFor(chain: Chain | undefined): SampleChip[] {
  if (chain === 'btc') return BTC_SAMPLES;
  return EVM_SAMPLES;
}
