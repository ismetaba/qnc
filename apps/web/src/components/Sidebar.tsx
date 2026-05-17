import { useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { NavItem, NodeHealth } from '@qnc/shared';
import { ROLE_CAPS } from '@qnc/shared';
import { useRole } from '../context/RoleContext.js';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/usePoll.js';

const NAV_LABELS: Record<NavItem, string> = {
  overview: 'Overview',
  endpoints: 'Endpoints',
  rpc: 'RPC Playground',
  metrics: 'Metrics',
  nodes: 'Nodes',
  users: 'Users',
  billing: 'Billing',
  settings: 'Settings'
};

const NAV_PATH: Record<NavItem, string> = {
  overview: '/',
  endpoints: '/endpoints',
  rpc: '/playground',
  metrics: '/metrics',
  nodes: '/nodes',
  users: '/users',
  billing: '/billing',
  settings: '/settings'
};

const PATH_TO_NAV: Record<string, NavItem> = Object.fromEntries(
  (Object.entries(NAV_PATH) as Array<[NavItem, string]>).map(([k, v]) => [v, k])
);

export type FleetTone = 'green' | 'amber' | 'red' | 'unknown';

export function fleetTone(nodes: NodeHealth[] | null | undefined): FleetTone {
  if (!nodes || nodes.length === 0) return 'unknown';
  if (nodes.some((n) => n.status === 'down')) return 'red';
  if (nodes.some((n) => n.status === 'lagging')) return 'amber';
  if (nodes.every((n) => n.status === 'healthy')) return 'green';
  return 'unknown';
}

const POLL_MS = 5_000;
const noopFetcher = () => Promise.resolve(null as unknown as NodeHealth[]);

export function Sidebar(): JSX.Element {
  const { role } = useRole();
  const items = ROLE_CAPS[role].nav;
  const showsNodes = items.includes('nodes');
  const fetchNodes = useCallback(() => api.nodes(), []);
  const { data: nodes } = usePoll(showsNodes ? fetchNodes : noopFetcher, POLL_MS);
  const tone = showsNodes ? fleetTone(nodes) : 'unknown';

  const { pathname } = useLocation();
  const activeItem: NavItem | undefined =
    PATH_TO_NAV[pathname] ?? (pathname === '/' ? 'overview' : undefined);

  return (
    <nav className="sidebar" aria-label="primary">
      <div className="sidebar-brand">
        <span className="dot" aria-hidden="true" />
        QNC
      </div>
      {items.map((item) => {
        const isActive = activeItem === item;
        return (
          <NavLink
            key={item}
            to={NAV_PATH[item]}
            end={item === 'overview'}
            className={({ isActive: a }) => 'nav-item' + (a ? ' active' : '')}
            data-nav={item}
          >
            {isActive ? (
              <motion.span
                layoutId="sidebar-active-pill"
                className="nav-item-pill"
                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                aria-hidden="true"
              />
            ) : null}
            <span>{NAV_LABELS[item]}</span>
            {item === 'nodes' && tone !== 'unknown' ? (
              <span
                data-testid="nodes-pulse"
                data-tone={tone}
                aria-label={`fleet status: ${tone}`}
                className={`nav-dot nav-dot--${tone}`}
              />
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );
}
