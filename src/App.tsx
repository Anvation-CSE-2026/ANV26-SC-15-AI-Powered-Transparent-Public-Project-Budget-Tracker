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

// Citizen Dashboard & Modules
import { CitizenDashboard } from './dashboards/citizen/CitizenDashboard';
import { CitizenProfilePage } from './pages/citizen/CitizenProfilePage';
import { CitizenSettingsPage } from './pages/citizen/CitizenSettingsPage';
import { CitizenComplaintsPage } from './pages/citizen/CitizenComplaintsPage';
import { CreateComplaintPage } from './pages/citizen/CreateComplaintPage';
import { CitizenComplaintDetailPage } from './pages/citizen/CitizenComplaintDetailPage';
import { CitizenSuggestionsPage } from './pages/citizen/CitizenSuggestionsPage';
import { CreateSuggestionPage } from './pages/citizen/CreateSuggestionPage';
import { CitizenSuggestionDetailPage } from './pages/citizen/CitizenSuggestionDetailPage';
import { CitizenVotingPage } from './pages/citizen/CitizenVotingPage';
import { CitizenPollDetailPage } from './pages/citizen/CitizenPollDetailPage';
import { CitizenProjectsPage } from './pages/citizen/CitizenProjectsPage';
import { CitizenMapPage } from './pages/citizen/CitizenMapPage';
import { CitizenAnnouncementsPage } from './pages/citizen/CitizenAnnouncementsPage';
import { CitizenNotificationsPage } from './pages/citizen/CitizenNotificationsPage';
import { CitizenAIPage } from './pages/citizen/CitizenAIPage';

// Authority Management Pages
import { ProjectManagerDashboardShell } from './pages/dashboards/ProjectManagerDashboardShell';
import { AuthorityComplaintsQueuePage } from './pages/authority/AuthorityComplaintsQueuePage';
import { AuthorityComplaintDetailPage } from './pages/authority/AuthorityComplaintDetailPage';
import { AuthoritySuggestionsQueuePage } from './pages/authority/AuthoritySuggestionsQueuePage';
import { AuthoritySuggestionDetailPage } from './pages/authority/AuthoritySuggestionDetailPage';
import { AuthorityPollsManagementPage } from './pages/authority/AuthorityPollsManagementPage';
import { CreatePollPage } from './pages/authority/CreatePollPage';
import { AuthorityPollDetailPage } from './pages/authority/AuthorityPollDetailPage';
import { ContractorDashboardShell } from './pages/dashboards/ContractorDashboardShell';

// Root Route Handler
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
          {/* Public Auth & Foundation Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<RootRoute />} />
          <Route
            path="/design-system"
            element={
              <Layout>
                <DesignSystemShowcase />
              </Layout>
            }
          />

          {/* ========================================================= */}
          {/* PHASE 3: CITIZEN DASHBOARD & MODULE ROUTES               */}
          {/* ========================================================= */}
          <Route
            path="/dashboard/citizen"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenDashboard />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/profile"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenProfilePage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/settings"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenSettingsPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/complaints"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenComplaintsPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/complaints/new"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CreateComplaintPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/complaints/:complaintId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenComplaintDetailPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/suggestions"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenSuggestionsPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/suggestions/new"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CreateSuggestionPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/suggestions/:suggestionId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenSuggestionDetailPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/voting"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenVotingPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/voting/:pollId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenPollDetailPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/projects"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenProjectsPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/map"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenMapPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/announcements"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenAnnouncementsPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/notifications"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenNotificationsPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/citizen/ai"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenAIPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* ========================================================= */}
          {/* AUTHORITY & CONTRACTOR SHELLS (Pending Phases 7 & 8)      */}
          {/* ========================================================= */}
          <Route
            path="/dashboard/project-manager"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['project_manager']}>
                  <Layout>
                    <ProjectManagerDashboardShell />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/project-manager/complaints"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['project_manager']}>
                  <Layout>
                    <AuthorityComplaintsQueuePage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/project-manager/complaints/:complaintId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['project_manager']}>
                  <Layout>
                    <AuthorityComplaintDetailPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* PHASE 5: AUTHORITY SUGGESTIONS & VOTING ROUTES */}
          <Route
            path="/dashboard/project-manager/suggestions"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['project_manager']}>
                  <Layout>
                    <AuthoritySuggestionsQueuePage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/project-manager/suggestions/:suggestionId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['project_manager']}>
                  <Layout>
                    <AuthoritySuggestionDetailPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/project-manager/voting"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['project_manager']}>
                  <Layout>
                    <AuthorityPollsManagementPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/project-manager/voting/new"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['project_manager']}>
                  <Layout>
                    <CreatePollPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/project-manager/voting/:pollId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['project_manager']}>
                  <Layout>
                    <AuthorityPollDetailPage />
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
                  <Layout>
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
