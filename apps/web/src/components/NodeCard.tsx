import { useRef, type MouseEvent } from 'react';
import type { NodeHealth } from '@qnc/shared';
import { ChainBadge } from './ChainBadge.js';
import { ProgressBar } from './ProgressBar.js';
import { formatGB, formatMs, formatNumber, formatUptime } from '../lib/format.js';

const STATUS_TONE: Record<NodeHealth['status'], 'good' | 'warn' | 'bad'> = {
  healthy: 'good',
  lagging: 'warn',
  down: 'bad'
};

const STATUS_DOT: Record<NodeHealth['status'], string> = {
  healthy: 'var(--green)',
  lagging: 'var(--amber)',
  down: 'var(--red)'
};

const CHAIN_TINT: Record<NodeHealth['chain'], string> = {
  eth: 'var(--eth)',
  avax: 'var(--avax)',
  btc: 'var(--btc)'
};

const MAX_TILT = 4; // degrees — kept subtle per spec

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

export function NodeCard({ health, compact = false }: { health: NodeHealth; compact?: boolean }): JSX.Element {
  const tint = CHAIN_TINT[health.chain];
  const cardRef = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (compact || prefersReducedMotion() || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const rx = -py * MAX_TILT;
    const ry = px * MAX_TILT;
    cardRef.current.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-1px)`;
  };

  const onLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = '';
    }
  };

  return (
    <div
      ref={cardRef}
      className="card interactive"
      data-testid="node-card"
      data-chain={health.chain}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${tint} 5%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--panel-elevated), var(--panel))`,
        transformStyle: 'preserve-3d',
        willChange: compact ? undefined : 'transform'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <ChainBadge chain={health.chain} size="md" />
        <div className="row" style={{ gap: 6 }}>
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: STATUS_DOT[health.status],
              boxShadow: `0 0 8px ${STATUS_DOT[health.status]}`
            }}
          />
          <span className="muted" style={{ textTransform: 'capitalize' }}>
            {health.status}
          </span>
        </div>
      </div>
      <div
        data-testid="node-block-height"
        className="mono tnum"
        style={{ fontSize: compact ? 22 : 32, fontWeight: 700, marginTop: 10, letterSpacing: '-0.01em' }}
      >
        #{formatNumber(health.blockHeight)}
      </div>
      {!compact ? (
        <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          {health.versionText}
        </div>
      ) : null}
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: 8,
          margin: '8px 0 12px'
        }}
      >
        <Stat label="Peers" value={formatNumber(health.peers)} />
        <Stat label="Latency" value={formatMs(health.latencyMs)} />
        {!compact ? <Stat label="Disk" value={formatGB(health.diskGB)} /> : null}
        <Stat label="Uptime" value={formatUptime(health.uptimeS)} />
      </dl>
      <ProgressBar
        value={health.syncProgress}
        label="Sync"
        tone={STATUS_TONE[health.status]}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div className="mono tnum" style={{ fontSize: 14 }}>
        {value}
      </div>
    </div>
  );
}
