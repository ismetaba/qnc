import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '@qnc/shared';
import { ALL_ROLES } from '@qnc/shared';

const STORAGE_KEY = 'qnc.role';
const DEFAULT_ROLE: Role = 'admin';

function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ALL_ROLES as string[]).includes(v);
}

function readStoredRole(): Role | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isRole(raw) ? raw : null;
  } catch {
    return null;
  }
}

export interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
  /** true once a role has been chosen and persisted (or pre-existed in localStorage). */
  hasChosen: boolean;
}

const RoleCtx = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }): JSX.Element {
  const [role, setRoleState] = useState<Role>(() => readStoredRole() ?? DEFAULT_ROLE);
  const [hasChosen, setHasChosen] = useState<boolean>(() => readStoredRole() !== null);

  useEffect(() => {
    document.body.setAttribute('data-role', role);
  }, [role]);

  const setRole = useCallback((r: Role) => {
    if (!isRole(r)) return;
    setRoleState(r);
    setHasChosen(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, r);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<RoleContextValue>(() => ({ role, setRole, hasChosen }), [role, setRole, hasChosen]);
  return <RoleCtx.Provider value={value}>{children}</RoleCtx.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleCtx);
  if (!ctx) throw new Error('useRole must be used within <RoleProvider>');
  return ctx;
}
