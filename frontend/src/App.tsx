import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvestigationWorkspacePage } from './pages/InvestigationWorkspacePage';
import { InvestigationDetailPage } from './pages/InvestigationDetailPage';
import { BeforeYouPayPage } from './pages/BeforeYouPayPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { ScamDiscoveryPage } from './pages/ScamDiscoveryPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

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
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/investigate" element={<InvestigationWorkspacePage />} />
              <Route path="/investigation/:id" element={<InvestigationDetailPage />} />
              <Route path="/before-you-pay" element={<BeforeYouPayPage />} />
              <Route path="/emergency" element={<EmergencyPage />} />
              <Route path="/discovery" element={<ScamDiscoveryPage />} />
              <Route path="/recovery" element={<RecoveryPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
