import type { Chain } from '@qnc/shared';

const CHAIN_COLOUR: Record<Chain, string> = {
  eth: 'var(--eth)',
  avax: 'var(--avax)',
  btc: 'var(--btc)'
};

const CHAIN_LABEL: Record<Chain, string> = {
  eth: 'ETH',
  avax: 'AVAX',
  btc: 'BTC'
};

export function ChainBadge({ chain, size = 'sm' }: { chain: Chain; size?: 'sm' | 'md' }): JSX.Element {
  const color = CHAIN_COLOUR[chain];
  const padding = size === 'md' ? '4px 10px' : '2px 8px';
  const fontSize = size === 'md' ? 12 : 11;
  return (
    <span
      data-testid="chain-badge"
      data-chain={chain}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding,
        borderRadius: 999,
        background: `color-mix(in srgb, ${color} 18%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
        fontSize,
        fontWeight: 600,
        letterSpacing: 0.4
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 6, height: 6, borderRadius: '50%', background: color }}
      />
      {CHAIN_LABEL[chain]}
    </span>
  );
}
