import { NavLink, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, MessageSquare, ClipboardList,
  CalendarDays, Users, Zap, UserCheck, Wallet, BarChart2,
  Settings, Bell, Search, MessageCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const workLinks = [
  { to: '/expert/dashboard',        label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/expert/projects',         label: 'Projects',        icon: FolderOpen,    badge: 4 },
  { to: '/expert/chat',             label: 'Chat',            icon: MessageSquare, badge: 7 },
  { to: '/expert/review-queue',     label: 'Review queue',    icon: ClipboardList, badge: 5 },
  { to: '/expert/agenda',           label: 'Agenda',          icon: CalendarDays },
  { to: '/expert/student-pipeline', label: 'Student pipeline',icon: Users,         badge: 48 },
];
const aiLinks = [
  { to: '/expert/task-breakdown', label: 'Task breakdown', icon: Zap },
  { to: '/expert/team-matching',  label: 'Team matching',  icon: UserCheck },
];
const youLinks = [
  { to: '/expert/wallet',    label: 'Wallet',    icon: Wallet },
  { to: '/expert/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/expert/settings',  label: 'Settings',  icon: Settings },
];

const titleMap = {
  '/expert/dashboard':        'Dashboard',
  '/expert/projects':         'Projects',
  '/expert/chat':             'Chat',
  '/expert/review-queue':     'Review queue',
  '/expert/agenda':           'Agenda',
  '/expert/student-pipeline': 'Student pipeline',
  '/expert/task-breakdown':   'Task breakdown',
  '/expert/team-matching':    'Team matching',
  '/expert/wallet':           'Wallet',
  '/expert/analytics':        'Analytics',
  '/expert/settings':         'Settings',
};

export default function ExpertLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const title = Object.entries(titleMap).find(([p]) => location.pathname.startsWith(p))?.[1] || '';

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'YB';
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Yacine Belkacem';

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-gray-900">TalentBridge</div>
            <div className="text-xs text-gray-500">Expert portal</div>
          </div>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto py-1">
          <NavSection label="Work" links={workLinks} />
          <NavSection label="AI"   links={aiLinks}   />
          <NavSection label="You"  links={youLinks}   />
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{fullName}</div>
              <div className="text-xs text-gray-500">Web Dev Expert</div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 text-lg leading-none">···</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 bg-white">
          <div className="text-sm text-gray-500">
            <span>Expert portal</span>
            {title && <><span className="mx-1.5">/</span><span className="font-medium text-gray-900">{title}</span></>}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors min-w-[200px]">
              <Search size={14} />
              <span>Search projects, students, t</span>
              <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">⌘K</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors relative">
              <Bell size={18} className="text-gray-500" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <MessageCircle size={18} className="text-gray-500" />
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
            `flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors group ${
              isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="flex items-center gap-2.5">
                <Icon size={15} className={isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} />
                {label}
              </span>
              {badge !== undefined && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
