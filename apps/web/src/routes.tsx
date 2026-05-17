import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useRole } from './context/RoleContext.js';
import { ROLE_CAPS, type NavItem } from '@qnc/shared';
import { OverviewPage } from './pages/Overview.js';
import { NodesPage } from './pages/Nodes.js';
import { MetricsPage } from './pages/Metrics.js';
import { EndpointsPage } from './pages/Endpoints.js';
import { PlaygroundPage } from './pages/Playground.js';
import { UsersPage } from './pages/Users.js';
import { BillingPage } from './pages/Billing.js';
import { SettingsPage } from './pages/Settings.js';
import { SwitchPage } from './pages/Switch.js';
import { MotionPage } from './components/MotionPage.js';

interface NavGuardProps {
  item: NavItem;
  children: JSX.Element;
}

function NavGuard({ item, children }: NavGuardProps): JSX.Element {
  const { role } = useRole();
  if (!ROLE_CAPS[role].nav.includes(item)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function AppRoutes(): JSX.Element {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/switch" element={<SwitchPage />} />
        <Route path="/" element={<MotionPage><OverviewPage /></MotionPage>} />
        <Route
          path="/endpoints"
          element={<MotionPage><NavGuard item="endpoints"><EndpointsPage /></NavGuard></MotionPage>}
        />
        <Route
          path="/playground"
          element={<MotionPage><NavGuard item="rpc"><PlaygroundPage /></NavGuard></MotionPage>}
        />
        <Route
          path="/metrics"
          element={<MotionPage><NavGuard item="metrics"><MetricsPage /></NavGuard></MotionPage>}
        />
        <Route
          path="/nodes"
          element={<MotionPage><NavGuard item="nodes"><NodesPage /></NavGuard></MotionPage>}
        />
        <Route
          path="/users"
          element={<MotionPage><NavGuard item="users"><UsersPage /></NavGuard></MotionPage>}
        />
        <Route
          path="/billing"
          element={<MotionPage><NavGuard item="billing"><BillingPage /></NavGuard></MotionPage>}
        />
        <Route
          path="/settings"
          element={<MotionPage><NavGuard item="settings"><SettingsPage /></NavGuard></MotionPage>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
