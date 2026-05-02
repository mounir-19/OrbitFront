import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FolderKanban, FileText, MessageSquare,
  TrendingUp, Star, User, Settings, Bell, Search
} from 'lucide-react';
import { getMyApplications, getCertificates, getNotifications } from '../../api/student.api';

export default function StudentLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [badges, setBadges] = useState({
    board: 0, projects: 0, applications: 0, messages: 0, certificates: 0,
  });
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    // Load real badge counts
    Promise.allSettled([
      getMyApplications(),
      getCertificates(),
      getNotifications({ read: false }),
    ]).then(([appsRes, certsRes, notifsRes]) => {
      const apps = appsRes.status === 'fulfilled' ? appsRes.value.data || [] : [];
      const certs = certsRes.status === 'fulfilled' ? certsRes.value.data || [] : [];
      const notifs = notifsRes.status === 'fulfilled' ? notifsRes.value.data || [] : [];

      const activeApps = apps.filter(a => ['pending', 'shortlisted'].includes(a.status)).length;
      const activeProjects = apps.filter(a => a.status === 'selected').length;

      setBadges({
        applications: activeApps,
        projects: activeProjects,
        certificates: certs.length,
        board: 0,
        messages: 0,
      });
      setUnreadNotifs(notifs.length);
    });
  }, [location.pathname]); // refresh on navigation

  const getPageTitle = () => {
    const map = {
      '/student/board': 'Project board',
      '/student/projects': 'My projects',
      '/student/applications': 'Applications',
      '/student/messages': 'Messages',
      '/student/earnings': 'Earnings',
      '/student/certificates': 'Certificates',
      '/student/profile': 'Profile',
      '/student/settings': 'Settings',
    };
    return map[location.pathname] || '';
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?';
  const fullName = user ? `${user.first_name} ${user.last_name}` : '';

  const workLinks = [
    { to: '/student/board', label: 'Project board', icon: LayoutDashboard, badge: badges.board || null },
    { to: '/student/projects', label: 'My projects', icon: FolderKanban, badge: badges.projects || null },
    { to: '/student/applications', label: 'Applications', icon: FileText, badge: badges.applications || null },
    { to: '/student/messages', label: 'Messages', icon: MessageSquare, badge: badges.messages || null },
  ];

  const meLinks = [
    { to: '/student/earnings', label: 'Earnings', icon: TrendingUp },
    { to: '/student/certificates', label: 'Certificates', icon: Star, badge: badges.certificates || null },
    { to: '/student/profile', label: 'Profile', icon: User },
    { to: '/student/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <aside className="w-[272px] flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-3">
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
            <div className="text-xs text-gray-500">Student portal</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="mb-1">
            <p className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Work</p>
            {workLinks.map(({ to, label, icon: Icon, badge }) => (
              <SidebarLink key={to} to={to} label={label} Icon={Icon} badge={badge} />
            ))}
          </div>
          <div className="mt-4">
            <p className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Me</p>
            {meLinks.map(({ to, label, icon: Icon, badge }) => (
              <SidebarLink key={to} to={to} label={label} Icon={Icon} badge={badge} />
            ))}
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">{fullName}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.domain?.replace(/_/g, ' ') || 'Student'}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 bg-white">
          <div className="text-sm text-gray-500">
            <span>Student portal</span>
            {getPageTitle() && (
              <><span className="mx-1.5">/</span><span className="font-medium text-gray-900">{getPageTitle()}</span></>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors min-w-[200px]">
              <Search size={14} />
              <span>Search projects, skills...</span>
              <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">⌘K</span>
            </button>
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-500" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
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

function SidebarLink({ to, label, Icon, badge }) {
  return (
    <NavLink to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors group ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex items-center gap-3">
            <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'} />
            {label}
          </span>
          {badge ? (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
              {badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}