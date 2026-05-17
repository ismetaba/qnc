import type { Role } from '@qnc/shared';

const ROLE_COLOR: Record<Role, string> = {
  admin: 'var(--accent-admin)',
  developer: 'var(--accent-developer)',
  billing: 'var(--accent-billing)',
  viewer: 'var(--accent-viewer)'
};

export function RolePill({ role }: { role: Role }): JSX.Element {
  const color = ROLE_COLOR[role];
  return (
    <span
      data-testid="role-pill"
      data-role={role}
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        background: `color-mix(in srgb, ${color} 20%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
        color,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.6
      }}
    >
      {role}
    </span>
  );
}
