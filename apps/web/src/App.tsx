import { BrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { RoleProvider, useRole } from './context/RoleContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { ToastProvider } from './components/Toast.js';
import { AppRoutes } from './routes.js';

function Shell(): JSX.Element {
  const { hasChosen } = useRole();
  const { pathname } = useLocation();

  // Boot guard: no role chosen → /switch (unless already there).
  if (!hasChosen && pathname !== '/switch') {
    return <Navigate to="/switch" replace />;
  }

  // /switch is full-bleed — no sidebar/header chrome.
  if (pathname === '/switch') {
    return <AppRoutes />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">
        <Header />
        <main>
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}

export function App(): JSX.Element {
  // `reducedMotion="user"` makes every framer-motion animation honour the
  // OS-level prefers-reduced-motion media query — transitions still fire
  // for layout but transforms / opacity respect the user's setting.
  return (
    <MotionConfig reducedMotion="user">
      <RoleProvider>
        <ToastProvider>
          <BrowserRouter>
            <Shell />
          </BrowserRouter>
        </ToastProvider>
      </RoleProvider>
    </MotionConfig>
  );
}
