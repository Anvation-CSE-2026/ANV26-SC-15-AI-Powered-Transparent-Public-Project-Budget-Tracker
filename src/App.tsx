import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleGuard } from './routes/RoleGuard';
import { getDashboardRouteForRole } from './routes/routeConfig';
import { Layout } from './components/layout/Layout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';

// Design System Showcase
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';

// Dashboard Shells
import { CitizenDashboardShell } from './pages/dashboards/CitizenDashboardShell';
import { ProjectManagerDashboardShell } from './pages/dashboards/ProjectManagerDashboardShell';
import { ContractorDashboardShell } from './pages/dashboards/ContractorDashboardShell';

// Root Redirect Component
const RootRoute: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={getDashboardRouteForRole(role)} replace />;
  }

  // If not signed in, show the Design System Showcase with header and prompt to login
  return (
    <Layout>
      <DesignSystemShowcase />
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Root & Design Showcase */}
          <Route path="/" element={<RootRoute />} />
          <Route
            path="/design-system"
            element={
              <Layout>
                <DesignSystemShowcase />
              </Layout>
            }
          />

          {/* Protected Role-Based Dashboard Routes */}
          <Route
            path="/dashboard/citizen"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout activeTab="dashboard">
                    <CitizenDashboardShell />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/project-manager"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['project_manager']}>
                  <Layout activeTab="authority-center">
                    <ProjectManagerDashboardShell />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/contractor"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['contractor']}>
                  <Layout activeTab="contractor-updates">
                    <ContractorDashboardShell />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
