import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Services from '../pages/landing/Services';

// Landing
import LandingPage from "../pages/landing/LandingPage";
import HowItWorks from '../pages/landing/HowItWorks';
import About from '../pages/landing/About';

// Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Layouts
import StudentLayout from '../components/layout/StudentLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ClientLayout from '../components/layout/ClientLayout';
import ExpertLayout from '../components/layout/ExpertLayout';

// Student pages
import ProjectBoard from '../pages/student/ProjectBoard';
import MyProjects from '../pages/student/MyProjects';
import Applications from '../pages/student/Applications';
import Messages from '../pages/student/Messages';
import Earnings from '../pages/student/Earnings';
import Certificates from '../pages/student/Certificates';
import Settings from '../pages/student/Settings';
import StudentAnalytics from '../pages/student/Analytics';
import StudentAgenda from '../pages/student/Agenda';

// Admin pages
import OpsDashboard from '../pages/admin/OpsDashboard';
import Schedule from '../pages/admin/Schedule';
import Approvals from '../pages/admin/Approvals';
import Disputes from '../pages/admin/Disputes';
import Payouts from '../pages/admin/Payouts';
import AllProjects from '../pages/admin/AllProjects';
import Users from '../pages/admin/Users';
import AuditLog from '../pages/admin/AuditLog';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminProjectDetail from "../pages/admin/AdminProjectDetail";

// Client pages
import ClientOverview from '../pages/client/ClientOverview';
import ClientProjects from '../pages/client/ClientProjects';
import ClientProjectDetail from '../pages/client/ProjectDetail';
import RequestProject from '../pages/client/RequestProject';
import ClientMessages from '../pages/client/ClientMessages';
import MyTeam from '../pages/client/MyTeam';
import Invoices from '../pages/client/Invoices';
import Contracts from '../pages/client/Contracts';
import ClientSettings from '../pages/client/ClientSettings';

// Expert pages
import ExpertDashboard from '../pages/expert/Dashboard';
import { ExpertProjects, ExpertProjectDetail, ExpertTasks } from '../pages/expert/Projects';
import ExpertChat from '../pages/expert/Chat';
import { StudentPipeline } from '../pages/expert/Students';
import { StudentPipeline as VettingPipeline } from '../pages/expert/NewStudents';
import Meetings from '../pages/expert/Meetings';
import { ExpertWallet } from '../pages/expert/ExpertWallet';
import { ExpertAnalytics } from '../pages/expert/ExpertAnalytics';
import { ExpertSettings } from '../pages/expert/ExpertSettings';
import PublishedProjects from '../pages/expert/PublishedProjects';
import PublishedProjectDetail from '../pages/expert/ProjectDetail';
import ScopeProject from "../pages/expert/ScopeAndPublish";
export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>

        {/* LANDING */}
        <Route path="/" element={<LandingPage />} />

        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/services" element={<Services />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />

        {/* STUDENT */}
        <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/student/board" replace />} />
          <Route path="board" element={<ProjectBoard />} />
          <Route path="projects" element={<MyProjects />} />
          <Route path="projects/:id" element={<MyProjects />} />
          <Route path="applications" element={<Applications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="profile" element={<Navigate to="/student/settings" replace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="agenda" element={<StudentAgenda />} />
        </Route>

        {/* ADMIN */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<OpsDashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="payouts" element={<Payouts />} />
          <Route path="projects" element={<AllProjects />} />
          <Route path="users" element={<Users />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
          {/* Legacy redirects */}
          <Route path="experts" element={<Navigate to="/admin/users" replace />} />
          <Route path="students" element={<Navigate to="/admin/users" replace />} />
          <Route path="clients" element={<Navigate to="/admin/users" replace />} />
          <Route path="universities" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/projects/:id" element={<AdminProjectDetail />} />
        </Route>

        {/* CLIENT */}
        <Route path="/client" element={<ProtectedRoute role="client"><ClientLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/client/overview" replace />} />
          <Route path="overview" element={<ClientOverview />} />
          <Route path="projects" element={<ClientProjects />} />
          <Route path="projects/:id" element={<ClientProjectDetail />} />
          <Route path="request-project" element={<RequestProject />} />
          <Route path="messages" element={<ClientMessages />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="team" element={<MyTeam />} />
          <Route path="settings" element={<ClientSettings />} />
        </Route>

        {/* EXPERT */}
        <Route path="/expert" element={<ProtectedRoute role="expert"><ExpertLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/expert/dashboard" replace />} />
          <Route path="dashboard" element={<ExpertDashboard />} />
          <Route path="/expert/projects/:id/scope" element={<ScopeProject />} />
          <Route path="projects/published" element={<PublishedProjects />} />
          <Route path="projects/published/:id" element={<PublishedProjectDetail />} />
          <Route path="projects" element={<ExpertProjects />} />
          <Route path="projects/:id" element={<ExpertProjectDetail />} />
          <Route path="projects/:id/tasks" element={<ExpertTasks />} />
          <Route path="students" element={<StudentPipeline />} />
          <Route path="vetting" element={<VettingPipeline />} />
          <Route path="chat" element={<ExpertChat />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="wallet" element={<ExpertWallet />} />
          <Route path="analytics" element={<ExpertAnalytics />} />
          <Route path="settings" element={<ExpertSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}