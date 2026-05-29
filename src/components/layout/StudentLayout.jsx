import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FolderKanban, MessageSquare,
  TrendingUp, Settings, Bell, Wallet, BarChart, Calendar,
  X, Check, Clock, AlertCircle, CheckCircle, Info, LogOut,
  ChevronLeft, ChevronRight, Award,
} from 'lucide-react';
import { getMyApplications, getNotifications, getConversations } from '../../api/student.api';
import api from '../../api/axiosInstance';

const workLinks = [
  { to: '/student/board', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/projects', label: 'Projects', icon: FolderKanban, end: true },
  { to: '/student/messages', label: 'Chat', icon: MessageSquare, end: false },
  { to: '/student/applications', label: 'Applications', icon: BarChart, end: true },
];

const youLinks = [
  { to: '/student/earnings', label: 'Wallet', icon: Wallet, end: false },
  { to: '/student/analytics', label: 'Analytics', icon: TrendingUp, end: false },
  { to: '/student/agenda', label: 'Agenda', icon: Calendar, end: false },
  { to: '/student/certificates', label: 'Certificates', icon: Award, end: false }, // 👈 add this
  { to: '/student/settings', label: 'Settings', icon: Settings, end: false },
];

const titleMap = {
  '/student/board': 'Dashboard',
  '/student/projects': 'Projects',
  '/student/messages': 'Chat',
  '/student/applications': 'Applications',
  '/student/earnings': 'Wallet',
  '/student/analytics': 'Analytics',
  '/student/agenda': 'Agenda',
  '/student/certificates': 'Certificates',
  '/student/profile': 'Profile',
  '/student/settings': 'Settings',
};

export default function StudentLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const [collapsed, setCollapsed] = useState(false);
  const [badges, setBadges] = useState({ projects: 0, chat: 0, applications: 0 });
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, notifsRes, convsRes] = await Promise.allSettled([
          getMyApplications(),
          getNotifications(),
          getConversations(),
        ]);

        const apps = appsRes.status === 'fulfilled' ? appsRes.value.data || [] : [];
        const activeProjects = apps.filter(a =>
          ['accepted', 'in_progress', 'in_review'].includes(a.status)
        ).length;
        const pendingApplications = apps.filter(a => a.status === 'pending').length;

        const notifs = notifsRes.status === 'fulfilled' ? notifsRes.value.data || [] : [];
        setNotifications(notifs);
        setUnreadNotifs(notifs.filter(n => !n.read).length);

        const convs = convsRes.status === 'fulfilled' ? convsRes.value.data || [] : [];
        const unreadMessages = convs.reduce((s, c) => s + (Number(c.unread) || 0), 0);

        setBadges({ projects: activeProjects, chat: unreadMessages, applications: pendingApplications });
      } catch { }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setShowNotifications(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadNotifs(prev => Math.max(0, prev - 1));
    } catch { }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifs(0);
    } catch { }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const notif = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.read) setUnreadNotifs(prev => Math.max(0, prev - 1));
    } catch { }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={16} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={16} />;
      case 'urgent': return <AlertCircle className="text-red-500" size={16} />;
      default: return <Info className="text-blue-400" size={16} />;
    }
  };

  const title = Object.entries(titleMap)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([p]) => location.pathname.startsWith(p))?.[1] || '';

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?';
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Student';

  const linksWithBadge = workLinks.map(l =>
    l.to === '/student/messages' ? { ...l, badge: badges.chat }
      : l.to === '/student/projects' ? { ...l, badge: badges.projects }
        : l.to === '/student/applications' ? { ...l, badge: badges.applications }
          : l
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">

      <aside className={`flex-shrink-0 bg-[#0e0c1a] flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[208px]'}`}>

        <div className="px-4 py-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#0e0c1a" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="3" fill="#0e0c1a" />
              </svg>
            </div>
            {!collapsed && (
              <div>
                <div className="text-[14px] font-bold text-white tracking-tight">Orbit</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest">Student Portal</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-7 h-7 -mr-7 z-20 relative' : 'w-6 h-6 hover:bg-white/10'}`}
          >
            {collapsed
              ? <ChevronRight size={14} className="text-gray-600" />
              : <ChevronLeft size={14} className="text-gray-400" />
            }
          </button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto py-2">
          <NavSection label="Work" links={linksWithBadge} collapsed={collapsed} />
          <NavSection label="You" links={youLinks} collapsed={collapsed} />
        </nav>

        <div className="px-3 py-4 border-t border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white truncate">{fullName}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Student</div>
              </div>
              <button onClick={logout} title="Logout"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors group flex-shrink-0">
                <LogOut size={14} className="text-gray-500 group-hover:text-red-400 transition-colors" />
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 bg-white">
          <div className="text-sm text-gray-400">
            <span>Student portal</span>
            {title && (
              <>
                <span className="mx-1.5 text-gray-300">/</span>
                <span className="font-semibold text-gray-900">{title}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Bell size={17} className="text-gray-500" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadNotifs > 99 ? '99+' : unreadNotifs}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full mt-2 right-0 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900">Notifications</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {unreadNotifs > 0 ? `${unreadNotifs} unread` : 'All caught up'}
                      </p>
                    </div>
                    {unreadNotifs > 0 && (
                      <button onClick={markAllAsRead}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        <CheckCircle size={12} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <Bell size={20} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No notifications</p>
                      </div>
                    ) : notifications.map(notif => (
                      <div key={notif.id}
                        className={`px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors group relative ${!notif.read ? 'bg-indigo-50/30' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">{getNotifIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] leading-snug ${notif.read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(notif.sent_at || notif.created_at).toLocaleString('en-GB', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                              {!notif.read && (
                                <button onClick={() => markAsRead(notif.id)}
                                  className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                  <Check size={10} /> Mark read
                                </button>
                              )}
                            </div>
                          </div>
                          <button onClick={() => deleteNotif(notif.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded">
                            <X size={13} className="text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={() => { navigate('/student/settings', { state: { tab: 'notifications' } }); setShowNotifications(false); }}
                        className="w-full text-center text-[13px] font-medium text-indigo-600 hover:text-indigo-700 py-1"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => navigate('/student/messages')}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <MessageSquare size={17} className="text-gray-500" />
              {badges.chat > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {badges.chat}
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

function NavSection({ label, links, collapsed }) {
  return (
    <div className="mb-2 mt-3">
      {!collapsed && (
        <p className="px-3 py-1 text-[9px] font-semibold text-gray-600 uppercase tracking-widest">{label}</p>
      )}
      {links.map(({ to, label, icon: Icon, badge, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2 rounded-xl text-[13px] mb-0.5 transition-colors group ${isActive
              ? 'bg-white/10 text-white font-medium'
              : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
            } ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? label : ''}
        >
          {({ isActive }) => (
            <>
              <span className={`flex items-center relative ${collapsed ? '' : 'gap-2.5'}`}>
                <Icon size={15} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                {!collapsed && <span>{label}</span>}
                {badge > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full" />
                )}
              </span>
              {badge > 0 && !collapsed && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'}`}>
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