
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { InvestigationWorkspacePage } from './pages/InvestigationWorkspacePage';
import { InvestigationDetailPage } from './pages/InvestigationDetailPage';
import { GuestResultsPage } from './pages/GuestResultsPage';
import { BeforeYouPayPage } from './pages/BeforeYouPayPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { ScamDiscoveryPage } from './pages/ScamDiscoveryPage';
import { RecoveryPage } from './pages/RecoveryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>

              {/* Open the application directly into investigation */}
              <Route
                path="/"
                element={<Navigate to="/investigate" replace />}
              />

              {/* Public guest investigation workspace */}
              <Route
                path="/investigate"
                element={<InvestigationWorkspacePage />}
              />

              {/* Public guest investigation results */}
              <Route
                path="/guest-results"
                element={<GuestResultsPage />}
              />

              {/* Existing database-backed pages */}
              <Route element={<ProtectedRoute />}>
                <Route
                  path="/dashboard"
                  element={<DashboardPage />}
                />

                <Route
                  path="/investigation/:id"
                  element={<InvestigationDetailPage />}
                />

                <Route
                  path="/before-you-pay"
                  element={<BeforeYouPayPage />}
                />

                <Route
                  path="/emergency"
                  element={<EmergencyPage />}
                />

                <Route
                  path="/discovery"
                  element={<ScamDiscoveryPage />}
                />

                <Route
                  path="/recovery"
                  element={<RecoveryPage />}
                />
              </Route>

              {/* Login and registration are not required for the demo */}
              <Route
                path="/login"
                element={<Navigate to="/investigate" replace />}
              />

              <Route
                path="/register"
                element={<Navigate to="/investigate" replace />}
              />

              <Route
                path="*"
                element={<Navigate to="/investigate" replace />}
              />

            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking authentication...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/investigate"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};

export default App;
