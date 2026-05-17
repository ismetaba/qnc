import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Role, User } from '@qnc/shared';
import { ALL_ROLES, ROLE_CAPS } from '@qnc/shared';
import { api } from '../lib/api.js';
import { useRole } from '../context/RoleContext.js';
import { Skeleton } from '../components/Skeleton.js';
import { capBlurb } from '../lib/capBlurb.js';
import { ROLE_ACCENT_HEX } from '../lib/roleAccents.js';

const ROLE_TITLE: Record<Role, string> = {
  admin: 'Administrator',
  developer: 'Developer',
  billing: 'Billing',
  viewer: 'Viewer'
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function readPreviousRole(): Role | null {
  try {
    const v = window.localStorage.getItem('qnc.role');
    return v && (ALL_ROLES as string[]).includes(v) ? (v as Role) : null;
  } catch {
    return null;
  }
}

export function SwitchPage(): JSX.Element {
  const navigate = useNavigate();
  const { setRole } = useRole();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previous = readPreviousRole();

  useEffect(() => {
    let cancelled = false;
    api
      .users()
      .then((u) => {
        if (!cancelled) setUsers(u);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'failed to load users');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pick = (role: Role) => {
    setRole(role);
    navigate('/');
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, role: Role) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(role);
    }
  };

  // Always show 4 cards. Use API users if loaded; otherwise fall back to ROLE_CAPS-derived stubs.
  const usersByRole = new Map<Role, User>(users?.map((u) => [u.role, u]) ?? []);

  return (
    <div className="switch-page" data-testid="switch-page">
      <div className="switch-content">
        <div className="switch-brand">
          <h1>
            <span className="logo-dot" aria-hidden="true" />
            QuickNode Clone
          </h1>
          <p>Pick a role to enter the console.</p>
        </div>

        {error ? (
          <div className="muted" role="alert" style={{ textAlign: 'center', marginBottom: 16 }}>
            ⚠ {error}
          </div>
        ) : null}

        <motion.div
          className="switch-grid"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.03 } }
          }}
        >
          {ALL_ROLES.map((role) => {
            const accent = ROLE_ACCENT_HEX[role];
            const user = usersByRole.get(role);
            return (
              <motion.button
                key={role}
                type="button"
                data-testid="role-card"
                data-role={role}
                data-current={previous === role ? 'true' : 'false'}
                aria-label={
                  user
                    ? `Continue as ${user.name}, ${ROLE_TITLE[role]}`
                    : `Continue as ${ROLE_TITLE[role]}`
                }
                className="role-card"
                style={{ ['--card-accent' as string]: accent }}
                onClick={() => pick(role)}
                onKeyDown={(e) => onKey(e, role)}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: 'spring', stiffness: 220, damping: 22 }
                  }
                }}
              >
                {user ? (
                  <span className="avatar-large" aria-hidden="true">
                    {initialsFor(user.name)}
                  </span>
                ) : (
                  <Skeleton width={56} height={56} rounded />
                )}
                <div>
                  <div className="role-title">{ROLE_TITLE[role]}</div>
                  <div className="role-name">
                    {user ? user.name : <Skeleton width={140} height={18} />}
                  </div>
                </div>
                <div className="role-blurb">{capBlurb(role)}</div>
                <div className="role-email">
                  {user ? user.email : <Skeleton width={120} height={11} />}
                </div>
                {previous === role ? (
                  <span className="you-were">You were here</span>
                ) : null}
                <span style={{ display: 'none' }}>{ROLE_CAPS[role].nav.length} nav items</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
