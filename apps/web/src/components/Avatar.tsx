function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** Stable color hash from name; covers the four role accents + a couple of fillers. */
const PALETTE = ['var(--accent-admin)', 'var(--accent-developer)', 'var(--accent-billing)', 'var(--accent-viewer)'];

function paletteFor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length]!;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }): JSX.Element {
  const color = paletteFor(name);
  return (
    <span
      data-testid="avatar"
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `color-mix(in srgb, ${color} 20%, var(--panel-2))`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
        fontWeight: 700,
        fontSize: Math.round(size * 0.4)
      }}
    >
      {initialsFor(name)}
    </span>
  );
}
