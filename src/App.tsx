import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, SignupPage, ForgotPasswordPage, VerifyEmailPage } from './pages/auth/AuthPages';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';
import { DeanDashboard } from './pages/dean/DeanDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EventsPage } from './pages/shared/EventsPage';
import { EventDetailPage } from './pages/shared/EventDetailPage';
import { CreateEventPage } from './pages/coordinator/CreateEventPage';
import { AttendancePage } from './pages/shared/AttendancePage';
import { CertificatesPage } from './pages/student/CertificatesPage';
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { ProfilePage } from './pages/shared/ProfilePage';
import { ApprovalsPage } from './pages/shared/ApprovalsPage';
import { AnalyticsPage } from './pages/shared/AnalyticsPage';
import { SearchPage } from './pages/shared/SearchPage';
import { RegistrationsPage } from './pages/coordinator/RegistrationsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { AnnouncementsPage } from './pages/admin/AnnouncementsPage';
import { LogsPage } from './pages/admin/LogsPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PageLoader } from './components/ui/Feedback';
import type { Role } from './types';

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { session, profile, loading, refreshProfile } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader label="Loading your workspace…" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-ink-500">We couldn't load your profile. This sometimes happens right after sign-up.</p>
        <button onClick={() => refreshProfile()} className="btn-primary">Retry</button>
      </div>
    );
  }
  if (roles && !roles.includes(profile.role)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function DashboardHome() {
  const { profile } = useAuth();
  if (!profile) return <PageLoader />;
  switch (profile.role) {
    case 'student':
      return <StudentDashboard />;
    case 'coordinator':
      return <CoordinatorDashboard />;
    case 'dean':
      return <DeanDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify" element={<VerifyCertificatePage />} />
      <Route path="/verify-certificate" element={<VerifyCertificatePage />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/new" element={<RequireAuth roles={['coordinator', 'admin']}><CreateEventPage /></RequireAuth>} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="approvals" element={<RequireAuth roles={['coordinator', 'dean', 'admin']}><ApprovalsPage /></RequireAuth>} />
        <Route path="registrations" element={<RequireAuth roles={['coordinator']}><RegistrationsPage /></RequireAuth>} />
        <Route path="analytics" element={<RequireAuth roles={['coordinator', 'dean', 'admin']}><AnalyticsPage /></RequireAuth>} />
        <Route path="users" element={<RequireAuth roles={['admin']}><UsersPage /></RequireAuth>} />
        <Route path="departments" element={<RequireAuth roles={['admin']}><DepartmentsPage /></RequireAuth>} />
        <Route path="announcements" element={<RequireAuth roles={['admin']}><AnnouncementsPage /></RequireAuth>} />
        <Route path="logs" element={<RequireAuth roles={['admin']}><LogsPage /></RequireAuth>} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
