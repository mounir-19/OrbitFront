import { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, Sparkles, MessageSquare, TrendingUp, FileText, Users, Settings, Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getNotifications } from '../../api/client.api';
import { getClientProjects, getClientInvoices } from '../../api/client.api';

const titleMap = {
  '/client/overview': 'Overview',
  '/client/projects': 'Projects',
  '/client/request-project': 'Request project',
  '/client/messages': 'Messages',
  '/client/invoices': 'Invoices',
  '/client/contracts': 'Contracts',
  '/client/team': 'My team',
  '/client/settings': 'Settings',
};

export default function ClientLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [badges, setBadges] = useState({ projects: 0, messages: 0, invoices: 0 });
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    Promise.allSettled([
      getClientProjects(),
      getClientInvoices({ status: 'pending' }),
      getNotifications({ read: false }),
    ]).then(([projRes, invRes, notifRes]) => {
      const projects = projRes.status === 'fulfilled' ? (projRes.value.data || []).length : 0;
      const invoices = invRes.status === 'fulfilled' ? (invRes.value.data || []).length : 0;
      const notifs = notifRes.status === 'fulfilled' ? (notifRes.value.data || []).length : 0;
      setBadges({ projects, messages: 0, invoices });
      setUnread(notifs);
    });
  }, [location.pathname]);

  const workLinks = [
    { to: '/client/overview', label: 'Overview', icon: Home },
    { to: '/client/projects', label: 'Projects', icon: FolderOpen, badge: badges.projects || null },
    { to: '/client/request-project', label: 'Request project', icon: Sparkles },
    { to: '/client/messages', label: 'Messages', icon: MessageSquare, badge: badges.messages || null },
  ];
  const financeLinks = [
    { to: '/client/invoices', label: 'Invoices', icon: TrendingUp, badge: badges.invoices || null },
    { to: '/client/contracts', label: 'Contracts', icon: FileText },
    { to: '/client/team', label: 'My team', icon: Users },
    { to: '/client/settings', label: 'Settings', icon: Settings },
  ];

  const title = Object.entries(titleMap).find(([p]) => location.pathname.startsWith(p))?.[1] || '';
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : '?';
  const fullName = user ? `${user.first_name} ${user.last_name}` : '';
  const company = user?.client?.company || '';

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
            <div className="text-xs text-gray-500">Client portal</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-1 overflow-y-auto">
          <div className="mb-1">
            <p className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Work</p>
            {workLinks.map(L => <SidebarLink key={L.to} {...L} />)}
          </div>
          <div className="mt-3">
            <p className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Finance</p>
            {financeLinks.map(L => <SidebarLink key={L.to} {...L} />)}
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{fullName}</div>
              <div className="text-xs text-gray-500 truncate">{company}</div>
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
            <span>Client portal</span>
            {title && <><span className="mx-1.5">/</span><span className="font-medium text-gray-900">{title}</span></>}
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors min-w-[200px]">
              <Search size={14} />
              <span>Search projects, invoices...</span>
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

function SidebarLink({ to, label, icon: Icon, badge }) {
  return (
    <NavLink to={to} className={({ isActive }) =>
      `flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors group ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
      }`
    }>
      {({ isActive }) => (
        <>
          <span className="flex items-center gap-3">
            <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'} />
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
  );
}