import { useCallback, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/usePoll.js';
import { RolePill } from '../components/RolePill.js';
import { Avatar } from '../components/Avatar.js';
import { StatCard } from '../components/StatCard.js';
import { EmptyState } from '../components/EmptyState.js';
import { Skeleton } from '../components/Skeleton.js';
import { capBlurb } from '../lib/capBlurb.js';
import type { Role, User } from '@qnc/shared';

const POLL_MS = 30_000;

const ROLES: Role[] = ['admin', 'developer', 'billing', 'viewer'];

export function UsersPage(): JSX.Element {
  const fetcher = useCallback(() => api.users(), []);
  const { data, error, loading } = usePoll(fetcher, POLL_MS);
  const [query, setQuery] = useState('');
  const [activeRole, setActiveRole] = useState<Role | 'all'>('all');

  const users = data ?? [];

  const byRole = useMemo(() => {
    const counts: Record<Role, number> = { admin: 0, developer: 0, billing: 0, viewer: 0 };
    for (const u of users) counts[u.role] = (counts[u.role] ?? 0) + 1;
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (activeRole !== 'all' && u.role !== activeRole) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, query, activeRole]);

  return (
    <div className="page">
      <header className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>Members</h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13, maxWidth: 560 }}>
            Workspace members and the role-based capabilities they unlock. Roles control which pages and actions
            appear in the sidebar.
          </p>
        </div>
        <button type="button" className="btn-primary" disabled title="Demo data is in-memory and resets on restart">
          + Invite member
        </button>
      </header>

      <div className="grid-4">
        <StatCard label="Total" value={users.length} />
        <StatCard label="Admins" value={byRole.admin} tone="good" />
        <StatCard label="Developers" value={byRole.developer} />
        <StatCard label="Billing & viewers" value={byRole.billing + byRole.viewer} />
      </div>

      <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          aria-label="Search members"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
          style={{ flex: 1, minWidth: 220, maxWidth: 360 }}
        />
        <div
          className="row"
          role="tablist"
          aria-label="Filter by role"
          style={{
            gap: 4,
            marginLeft: 'auto',
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: 3,
          }}
        >
          <RoleChip label="All" active={activeRole === 'all'} onClick={() => setActiveRole('all')} count={users.length} />
          {ROLES.map((r) => (
            <RoleChip key={r} label={r} active={activeRole === r} onClick={() => setActiveRole(r)} count={byRole[r]} />
          ))}
        </div>
      </div>

      {error ? (
        <div className="card" role="alert" style={{ borderColor: 'var(--red)' }}>
          <strong style={{ color: 'var(--red)' }}>Failed to load members.</strong>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>{error.message}</div>
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table data-testid="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--panel-2)' }}>
              <Th>Member</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Capabilities</Th>
            </tr>
          </thead>
          <tbody>
            {loading && !data
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <Td><Skeleton width={140} /></Td>
                    <Td><Skeleton width={180} /></Td>
                    <Td><Skeleton width={70} rounded /></Td>
                    <Td><Skeleton width={240} /></Td>
                  </tr>
                ))
              : filtered.map((u: User) => (
                  <tr key={u.id} data-testid="user-row" style={{ borderTop: '1px solid var(--border)' }}>
                    <Td>
                      <div className="row" style={{ gap: 10 }}>
                        <Avatar name={u.name} />
                        <span>{u.name}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="mono muted" style={{ fontSize: 12 }}>{u.email}</span>
                    </Td>
                    <Td>
                      <RolePill role={u.role} />
                    </Td>
                    <Td>
                      <span className="muted" style={{ fontSize: 12 }}>{capBlurb(u.role)}</span>
                    </Td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && users.length > 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <span className="muted" style={{ fontSize: 13 }}>
              No members match <strong>{query || activeRole}</strong>. Try a different filter.
            </span>
          </div>
        ) : null}
        {!loading && users.length === 0 ? (
          <div style={{ padding: 16 }}>
            <EmptyState title="No members yet" hint="Seed the demo store to populate the workspace." />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RoleChip({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count: number }): JSX.Element {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#0a0d14' : 'var(--text)',
        border: 'none',
        borderRadius: 999,
        padding: '4px 12px',
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize',
        cursor: 'pointer',
        transition: 'background 160ms, color 160ms',
      }}
    >
      {label}
      <span style={{ marginLeft: 6, opacity: active ? 0.7 : 0.5, fontSize: 11 }}>{count}</span>
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '10px 14px',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: 'var(--muted)',
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }): JSX.Element {
  return <td style={{ padding: '10px 14px' }}>{children}</td>;
}
