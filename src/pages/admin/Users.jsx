import { useState, useEffect } from 'react';
import { Star, Users as UsersIcon, Search, X } from 'lucide-react';
import { getUsers, updateUserStatus } from '../../api/admin.api';
import toast from 'react-hot-toast';

const ROLE_TABS = [
  { label: 'All', value: null },
  { label: 'Experts', value: 'expert' },
  { label: 'Students', value: 'student' },
  { label: 'Clients', value: 'client' },
];

const STATUS_CFG = {
  active: { label: 'Active', dot: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  pending: { label: 'Pending', dot: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  suspended: { label: 'Suspended', dot: 'bg-red-400', text: 'text-red-500', bg: 'bg-red-50 border-red-100' },
  inactive: { label: 'Inactive', dot: 'bg-[#d1d5db]', text: 'text-[#9ca3af]', bg: 'bg-[#f5f3ff] border-[#ede9fe]' },
};

const ROLE_CFG = {
  expert: { label: 'Expert', color: 'text-amber-600  bg-amber-50  border-amber-100' },
  student: { label: 'Student', color: 'text-blue-600   bg-blue-50   border-blue-100' },
  client: { label: 'Client', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  admin: { label: 'Admin', color: 'text-[#7c3aed]  bg-[#f5f3ff] border-[#ede9fe]' },
};

const getInitials = (str = '') =>
  str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

export default function Users() {
  const [allUsers, setAllUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [toggling, setToggling] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getUsers({ role: 'expert' }),
      getUsers({ role: 'student' }),
      getUsers({ role: 'client' }),
    ]).then(([expRes, stuRes, cliRes]) => {
      const experts = expRes.status === 'fulfilled' ? expRes.value.data?.users || [] : [];
      const students = stuRes.status === 'fulfilled' ? stuRes.value.data?.users || [] : [];
      const clients = cliRes.status === 'fulfilled' ? cliRes.value.data?.users || [] : [];
      const all = [...experts, ...students, ...clients]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAllUsers(all);
      setUsers(all);
    }).finally(() => setLoading(false));
  }, []);

  const handleTabChange = (i) => {
    setActiveTab(i);
    const role = ROLE_TABS[i].value;
    const base = role ? allUsers.filter(u => u.role === role) : allUsers;
    setUsers(applySearch(base, search));
  };

  const applySearch = (list, q) => {
    if (!q.trim()) return list;
    const lower = q.toLowerCase();
    return list.filter(u =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(lower) ||
      u.email?.toLowerCase().includes(lower) ||
      u.domain?.toLowerCase().includes(lower) ||
      u.student?.university?.toLowerCase().includes(lower) ||
      u.expert?.specialty?.toLowerCase().includes(lower) ||
      u.client?.company?.toLowerCase().includes(lower)
    );
  };

  const handleSearch = (q) => {
    setSearch(q);
    const role = ROLE_TABS[activeTab].value;
    const base = role ? allUsers.filter(u => u.role === role) : allUsers;
    setUsers(applySearch(base, q));
  };

  const handleToggle = async (user) => {
    setToggling(user.id);
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(user.id, newStatus);
      const updated = allUsers.map(u => u.id === user.id ? { ...u, status: newStatus } : u);
      setAllUsers(updated);
      const role = ROLE_TABS[activeTab].value;
      const base = role ? updated.filter(u => u.role === role) : updated;
      setUsers(applySearch(base, search));
      toast.success(`User ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally { setToggling(null); }
  };

  const counts = {};
  allUsers.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1; });

  const tabCount = (t, i) => i === 0 ? allUsers.length : counts[t.value] || 0;

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Users</h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            {loading ? 'Loading…' : `${allUsers.length} users · ${allUsers.filter(u => u.status === 'pending').length} pending approval`}
          </p>
        </div>

        {!loading && (
          <div className="flex items-center gap-4 bg-[#f5f3ff] border border-[#ede9fe] rounded-2xl px-6 py-4">
            <div className="w-12 h-12 rounded-xl bg-[#ede9fe] flex items-center justify-center">
              <UsersIcon size={20} className="text-[#7c3aed]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest mb-0.5">Platform Users</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#111827]">{allUsers.length}</span>
                <span className="text-sm text-[#9ca3af]">registered</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Experts', value: counts['expert'] || 0, color: 'text-amber-600' },
          { label: 'Students', value: counts['student'] || 0, color: 'text-blue-600' },
          { label: 'Clients', value: counts['client'] || 0, color: 'text-emerald-600' },
          { label: 'Pending', value: allUsers.filter(u => u.status === 'pending').length, color: 'text-[#9ca3af]' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#ede9fe] rounded-2xl px-6 py-5">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">{s.label}</div>
            {loading
              ? <Skeleton className="h-7 w-10" />
              : <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            }
          </div>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by name, email, domain, university…"
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#ede9fe] rounded-xl text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all"
        />
        {search && (
          <button onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#f5f3ff] rounded-lg transition-colors">
            <X size={13} className="text-[#9ca3af]" />
          </button>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 border-b border-[#f5f3ff] mb-5">
        {ROLE_TABS.map((t, i) => (
          <button key={t.label} onClick={() => handleTabChange(i)}
            className={`relative flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors
              ${activeTab === i ? 'text-[#7c3aed]' : 'text-[#9ca3af] hover:text-[#6b7280]'}`}>
            {t.label}
            {tabCount(t, i) > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                ${activeTab === i ? 'bg-[#7c3aed] text-white' : 'bg-[#f5f3ff] text-[#7c3aed]'}`}>
                {tabCount(t, i)}
              </span>
            )}
            {activeTab === i && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#7c3aed] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f3ff]">
              {['User', 'Role', 'Domain', 'Extra', 'Joined', 'Status', ''].map((h, i) => (
                <th key={h + i}
                  className="px-6 py-4 text-left text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest bg-[#fafafa]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f3ff]">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  <td colSpan={7} className="px-6 py-4">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <UsersIcon size={28} className="text-[#ede9fe] mx-auto mb-3" />
                  <p className="text-sm text-[#9ca3af]">No users found.</p>
                </td>
              </tr>
            ) : users.map(u => {
              const statusCfg = STATUS_CFG[u.status] || STATUS_CFG.inactive;
              const roleCfg = ROLE_CFG[u.role] || ROLE_CFG.admin;

              // Extra info column depends on role
              const extra = u.role === 'expert'
                ? (u.expert?.specialty || '—')
                : u.role === 'student'
                  ? u.student?.university || '—'
                  : u.client?.company || '—';

              // Rating for students
              const rating = u.role === 'student' && u.student?.global_rating;

              return (
                <tr key={u.id} className="hover:bg-[#fafafa] transition-colors group">

                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#ede9fe] flex items-center justify-center text-[12px] font-bold text-[#7c3aed] flex-shrink-0">
                        {getInitials(`${u.first_name} ${u.last_name}`)}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#111827]">
                          {u.first_name} {u.last_name}
                        </div>
                        <div className="text-[11px] text-[#9ca3af] truncate max-w-[180px]">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${roleCfg.color}`}>
                      {roleCfg.label}
                    </span>
                  </td>

                  {/* Domain */}
                  <td className="px-6 py-4 text-[13px] text-[#6b7280] capitalize">
                    {u.domain?.replace(/_/g, ' ') || '—'}
                  </td>

                  {/* Extra */}
                  <td className="px-6 py-4">
                    {rating ? (
                      <span className="flex items-center gap-1 text-[13px] text-[#374151]">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {Number(rating).toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-[13px] text-[#6b7280] truncate max-w-[140px] block">{extra}</span>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4 text-[13px] text-[#9ca3af]">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 w-fit text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${statusCfg.text} ${statusCfg.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={toggling === u.id}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50
                        ${u.status === 'suspended'
                          ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]'
                          : 'border border-[#ede9fe] text-[#6b7280] hover:bg-[#f5f3ff]'}`}>
                      {toggling === u.id ? '…' : u.status === 'suspended' ? 'Restore' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}