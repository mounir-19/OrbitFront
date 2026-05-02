import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

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
import Profile from '../pages/student/Profile';
import Settings from '../pages/student/Settings';

// Admin pages
import OpsDashboard from '../pages/admin/OpsDashboard';
import Schedule from '../pages/admin/Schedule';
import Approvals from '../pages/admin/Approvals';
import Disputes from '../pages/admin/Disputes';
import Payouts from '../pages/admin/Payouts';
import AllProjects from '../pages/admin/AllProjects';
import { Experts, Students, Clients, Universities, AuditLog } from '../pages/admin/NetworkPages';
import AdminSettings from '../pages/admin/AdminSettings';

// Client pages
import ClientOverview from '../pages/client/Overview';
import ClientProjects from '../pages/client/Projects';
import ProjectDetail from '../pages/client/ProjectDetail';
import RequestProject from '../pages/client/RequestProject';
import { ClientMessages, MyTeam, Invoices, Contracts, ClientSettings } from '../pages/client/ClientPages';

// Expert pages
import ExpertDashboard from '../pages/expert/Dashboard';
import { ExpertProjects, ExpertProjectDetail, ExpertTasks } from '../pages/expert/Projects';
import ExpertChat from '../pages/expert/Chat';
import { ReviewQueue, Agenda, StudentPipeline } from '../pages/expert/ExpertPages';
import { TaskBreakdown, TeamMatching } from '../pages/expert/AIAgents';
import { ExpertWallet, ExpertAnalytics, ExpertSettings } from '../pages/expert/ExpertYouPages';

export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>

        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* STUDENT */}
        <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/student/board" replace />} />
          <Route path="board" element={<ProjectBoard />} />
          <Route path="projects" element={<MyProjects />} />
          <Route path="applications" element={<Applications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
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
          <Route path="experts" element={<Experts />} />
          <Route path="students" element={<Students />} />
          <Route path="clients" element={<Clients />} />
          <Route path="universities" element={<Universities />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* CLIENT */}
        <Route path="/client" element={<ProtectedRoute role="client"><ClientLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/client/overview" replace />} />
          <Route path="overview" element={<ClientOverview />} />
          <Route path="projects" element={<ClientProjects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
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
          <Route path="projects" element={<ExpertProjects />} />
          <Route path="projects/:id" element={<ExpertProjectDetail />} />
          <Route path="projects/:id/tasks" element={<ExpertTasks />} />
          <Route path="chat" element={<ExpertChat />} />
          <Route path="review-queue" element={<ReviewQueue />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="student-pipeline" element={<StudentPipeline />} />
          <Route path="task-breakdown" element={<TaskBreakdown />} />
          <Route path="team-matching" element={<TeamMatching />} />
          <Route path="wallet" element={<ExpertWallet />} />
          <Route path="analytics" element={<ExpertAnalytics />} />
          <Route path="settings" element={<ExpertSettings />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}