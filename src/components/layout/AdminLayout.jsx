import { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, CheckSquare, Zap, CreditCard,
  FolderOpen, Star, Users, Briefcase, GraduationCap,
  FileText, Settings, Bell, Search
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getUsers, getAllProjects, getPayouts, getNotifications } from '../../api/admin.api';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [badges, setBadges] = useState({
    approvals: 0, disputes: 0, projects: 0,
    experts: 0, students: 0, clients: 0,
  });
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    Promise.allSettled([
      getUsers({ status: 'pending' }),
      getAllProjects(),
      getUsers({ role: 'expert' }),
      getUsers({ role: 'student' }),
      getUsers({ role: 'client' }),
      getPayouts({ status: 'pending' }),
      getNotifications({ read: false }),
    ]).then(([pendingRes, projectsRes, expertsRes, studentsRes, clientsRes, payoutsRes, notifsRes]) => {
      const pending = pendingRes.status === 'fulfilled' ? pendingRes.value.data?.total || 0 : 0;
      const payouts = payoutsRes.status === 'fulfilled' ? (payoutsRes.value.data || []).length : 0;
      const projects = projectsRes.status === 'fulfilled' ? (projectsRes.value.data || []).length : 0;
      const experts = expertsRes.status === 'fulfilled' ? expertsRes.value.data?.total || 0 : 0;
      const students = studentsRes.status === 'fulfilled' ? studentsRes.value.data?.total || 0 : 0;
      const clients = clientsRes.status === 'fulfilled' ? clientsRes.value.data?.total || 0 : 0;
      const notifs = notifsRes.status === 'fulfilled' ? (notifsRes.value.data || []).length : 0;

      setBadges({
        approvals: pending + payouts,
        disputes: 0,
        projects,
        experts,
        students,
        clients,
      });
      setUnread(notifs);
    });
  }, [location.pathname]);

  const operationsLinks = [
    { to: '/admin/dashboard', label: 'Ops dashboard', icon: LayoutDashboard },
    { to: '/admin/schedule', label: 'Schedule', icon: Calendar },
    { to: '/admin/approvals', label: 'Approvals', icon: CheckSquare, badge: badges.approvals || null },
    { to: '/admin/disputes', label: 'Disputes', icon: Zap, badge: badges.disputes || null },
    { to: '/admin/payouts', label: 'Payouts', icon: CreditCard },
    { to: '/admin/projects', label: 'All projects', icon: FolderOpen, badge: badges.projects || null },
  ];
  const networkLinks = [
    { to: '/admin/experts', label: 'Experts', icon: Star, badge: badges.experts || null },
    { to: '/admin/students', label: 'Students', icon: Users, badge: badges.students || null },
    { to: '/admin/clients', label: 'Clients', icon: Briefcase, badge: badges.clients || null },
  ];
  const systemLinks = [
    { to: '/admin/audit-log', label: 'Audit log', icon: FileText },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const pageTitle = () => {
    const map = {
      '/admin/dashboard': 'Ops dashboard',
      '/admin/schedule': 'Schedule',
      '/admin/approvals': 'Approvals',
      '/admin/disputes': 'Disputes',
      '/admin/payouts': 'Payouts',
      '/admin/projects': 'All projects',
      '/admin/experts': 'Experts',
      '/admin/students': 'Students',
      '/admin/clients': 'Clients',
      '/admin/audit-log': 'Audit log',
      '/admin/settings': 'Settings',
    };
    return map[location.pathname] || '';
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'KM';
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Admin';

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <aside className="w-[220px] flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.3" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-gray-900">TalentBridge</div>
            <div className="text-xs text-gray-500">Admin console</div>
          </div>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto py-1">
          <NavSection label="Operations" links={operationsLinks} />
          <NavSection label="Network" links={networkLinks} />
          <NavSection label="System" links={systemLinks} />
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{fullName}</div>
              <div className="text-xs text-gray-500">Platform operator</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2">
            Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 bg-white">
          <div className="text-sm text-gray-500">
            <span>Admin</span>
            {pageTitle() && <><span className="mx-1.5">/</span><span className="font-medium text-gray-900">{pageTitle()}</span></>}
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors min-w-[220px]">
              <Search size={14} />
              <span>Search users, projects...</span>
              <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">⌘K</span>
            </button>
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-500" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavSection({ label, links }) {
  return (
    <div className="mb-1 mt-3">
      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      {links.map(({ to, label, icon: Icon, badge }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors group ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="flex items-center gap-2.5">
                <Icon size={15} className={isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} />
                {label}
              </span>
              {badge ? (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {badge}
                </span>
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}