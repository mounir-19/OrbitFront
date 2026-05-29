import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, CheckSquare, Zap, CreditCard,
  FolderOpen, Users, FileText, Settings,
  Bell, ChevronLeft, ChevronRight, LogOut,
  X, Check, Clock, CheckCircle, AlertCircle, Info,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getUsers, getAllProjects, getPayouts, getNotifications } from '../../api/admin.api';

const titleMap = {
  '/admin/dashboard': 'Ops Dashboard',
  '/admin/schedule': 'Schedule',
  '/admin/approvals': 'Approvals',
  '/admin/disputes': 'Disputes',
  '/admin/payouts': 'Payouts',
  '/admin/projects': 'All Projects',
  '/admin/users': 'Users',
  '/admin/audit-log': 'Audit Log',
  '/admin/settings': 'Settings',
};

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const [collapsed, setCollapsed] = useState(false);
  const [badges, setBadges] = useState({ approvals: 0, projects: 0, users: 0 });
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      Promise.allSettled([
        getUsers({ status: 'pending' }),
        getAllProjects(),
        getPayouts({ status: 'pending' }),
        getNotifications(),
      ]).then(([pendingRes, projectsRes, payoutsRes, notifsRes]) => {
        const pending = pendingRes.status === 'fulfilled' ? pendingRes.value.data?.total || 0 : 0;
        const payouts = payoutsRes.status === 'fulfilled' ? (payoutsRes.value.data || []).length : 0;
        const notifs = notifsRes.status === 'fulfilled' ? notifsRes.value.data || [] : [];

        setBadges({
          approvals: pending + payouts,
          projects: projectsRes.status === 'fulfilled' ? (projectsRes.value.data || []).length : 0,
          users: pending,
        });
        setNotifications(notifs);
        setUnreadNotifs(notifs.filter(n => !n.read).length);
      });
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

  const markAsRead = (id) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); setUnreadNotifs(p => Math.max(0, p - 1)); };
  const markAllAsRead = () => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); setUnreadNotifs(0); };
  const deleteNotif = (id) => {
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.read) setUnreadNotifs(p => Math.max(0, p - 1));
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-500" size={15} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={15} />;
      case 'urgent': return <AlertCircle className="text-red-500" size={15} />;
      default: return <Info className="text-[#7c3aed]" size={15} />;
    }
  };

  const title = Object.entries(titleMap)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([p]) => location.pathname.startsWith(p))?.[1] || '';

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'AD';
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Admin';

  const operationsLinks = [
    { to: '/admin/dashboard', label: 'Ops Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/schedule', label: 'Schedule', icon: Calendar, end: false },
    { to: '/admin/approvals', label: 'Approvals', icon: CheckSquare, end: false, badge: badges.approvals || null },
    { to: '/admin/disputes', label: 'Disputes', icon: Zap, end: false },
    { to: '/admin/payouts', label: 'Payouts', icon: CreditCard, end: false },
    { to: '/admin/projects', label: 'All Projects', icon: FolderOpen, end: false },
    { to: '/admin/users', label: 'Users', icon: Users, end: false, badge: badges.users || null },
  ];

  const systemLinks = [
    { to: '/admin/audit-log', label: 'Audit Log', icon: FileText, end: false },
    { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
  ];

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`flex-shrink-0 bg-[#0e0c1a] flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[208px]'}`}>

        {/* Logo */}
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
                <div className="text-[9px] text-gray-500 uppercase tracking-widest">Admin Console</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0
              ${collapsed ? 'w-7 h-7 -mr-7 z-20 relative' : 'w-6 h-6 hover:bg-white/10'}`}
          >
            {collapsed
              ? <ChevronRight size={14} className="text-gray-600" />
              : <ChevronLeft size={14} className="text-gray-400" />
            }
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto py-2">
          <NavSection label="Operations" links={operationsLinks} collapsed={collapsed} />
          <NavSection label="System" links={systemLinks} collapsed={collapsed} />
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white truncate">{fullName}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Platform operator</div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                title="Logout"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors group flex-shrink-0"
              >
                <LogOut size={14} className="text-gray-500 group-hover:text-red-400 transition-colors" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-14 border-b border-[#f0eeff] flex items-center justify-between px-6 flex-shrink-0 bg-white">
          <div className="text-sm text-[#9ca3af]">
            <span>Admin</span>
            {title && (
              <>
                <span className="mx-1.5 text-[#d1d5db]">/</span>
                <span className="font-semibold text-[#111827]">{title}</span>
              </>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f3ff] transition-colors"
            >
              <Bell size={17} className="text-[#6b7280]" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#7c3aed] text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full mt-2 right-0 w-[380px] bg-white rounded-2xl shadow-2xl border border-[#ede9fe] overflow-hidden z-50">
                <div className="px-5 py-4 border-b border-[#f5f3ff] flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-bold text-[#111827]">Notifications</h3>
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">
                      {unreadNotifs > 0 ? `${unreadNotifs} unread` : 'All caught up'}
                    </p>
                  </div>
                  {unreadNotifs > 0 && (
                    <button onClick={markAllAsRead}
                      className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest flex items-center gap-1 hover:text-[#6d28d9]">
                      <CheckCircle size={11} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <Bell size={20} className="text-[#ede9fe] mx-auto mb-2" />
                      <p className="text-sm text-[#9ca3af]">No notifications</p>
                    </div>
                  ) : notifications.map(notif => (
                    <div key={notif.id}
                      className={`px-5 py-3.5 border-b border-[#f5f3ff] hover:bg-[#fafafa] transition-colors group relative
                        ${!notif.read ? 'bg-[#f5f3ff]/60' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{getNotifIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-snug ${notif.read ? 'text-[#9ca3af]' : 'text-[#111827] font-medium'}`}>
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-[#9ca3af] flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(notif.sent_at || notif.created_at).toLocaleString('en-GB', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            {!notif.read && (
                              <button onClick={() => markAsRead(notif.id)}
                                className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest flex items-center gap-1 hover:text-[#6d28d9]">
                                <Check size={10} /> Mark read
                              </button>
                            )}
                          </div>
                        </div>
                        <button onClick={() => deleteNotif(notif.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg">
                          <X size={13} className="text-[#9ca3af] hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#fafafa]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── Nav Section ──────────────────────────────────────────────────────────────
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
          title={collapsed ? label : ''}
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2 rounded-xl text-[13px] mb-0.5 transition-colors group
            ${isActive ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}
            ${collapsed ? 'justify-center' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex items-center relative ${collapsed ? '' : 'gap-2.5'}`}>
                <Icon size={15} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                {!collapsed && <span>{label}</span>}
                {badge > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#7c3aed] rounded-full" />
                )}
              </span>
              {badge > 0 && !collapsed && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                  ${isActive ? 'bg-white/20 text-white' : 'bg-[#7c3aed] text-white'}`}>
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