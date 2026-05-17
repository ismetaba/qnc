import { Link, useLocation } from 'react-router-dom';
import { useRole } from '../context/RoleContext.js';
import { RolePill } from './RolePill.js';

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/endpoints': 'Endpoints',
  '/playground': 'RPC Playground',
  '/metrics': 'Metrics',
  '/nodes': 'Nodes',
  '/users': 'Users',
  '/billing': 'Billing',
  '/settings': 'Settings'
};

export function Header(): JSX.Element {
  const { pathname } = useLocation();
  const { role } = useRole();
  return (
    <header className="header">
      <h1>{TITLES[pathname] ?? 'QNC'}</h1>
      <div className="header-actions">
        <span className="muted" style={{ fontSize: 12 }}>Acting as</span>
        <RolePill role={role} />
        <Link to="/switch" className="btn-ghost" data-testid="switch-link">
          Switch role
        </Link>
      </div>
    </header>
  );
}
