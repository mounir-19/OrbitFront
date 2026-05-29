import { useState, useEffect } from 'react';
import {
  TrendingUp, FolderOpen, Users, Star, Zap, User, Briefcase,
  CreditCard, ArrowRight, ChevronRight, BarChart2, Clock, Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAllProjects, getUsers, getPayouts, updateUserStatus,
  updatePayment, getStudentsList,
} from '../../api/admin.api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (str = '') =>
  str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const fmt = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k`
      : String(Math.round(n));

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, loading, sub }) => (
  <div className="bg-white rounded-2xl border border-[#ede9fe] px-6 py-5 flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
      <Icon size={17} className="text-[#7c3aed]" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-1">{label}</div>
      {loading
        ? <Skeleton className="h-7 w-16" />
        : <div className="text-2xl font-bold text-[#111827] leading-none">{value ?? '—'}</div>
      }
      {sub && !loading && (
        <div className="text-[10px] text-[#9ca3af] mt-1">{sub}</div>
      )}
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OpsDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    projects: 0, experts: 0, students: 0, clients: 0, gmv: 0, pending: 0,
  });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [uniFlow, setUniFlow] = useState([]);
  const [gmvBars, setGmvBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      getAllProjects({ status: 'in_progress' }),
      getUsers({ role: 'expert', status: 'active' }),
      getUsers({ role: 'student', status: 'active' }),
      getUsers({ role: 'client', status: 'active' }),
      getUsers({ status: 'pending' }),
      getPayouts({ status: 'pending' }),
      getPayouts(),
      getStudentsList(),
    ]).then(([projRes, expRes, stuRes, cliRes, pendingRes, pendingPayRes, allPayRes, studentsListRes]) => {

      const projects = projRes.status === 'fulfilled' ? (projRes.value.data || []).length : 0;
      const experts = expRes.status === 'fulfilled' ? expRes.value.data?.total || 0 : 0;
      const students = stuRes.status === 'fulfilled' ? stuRes.value.data?.total || 0 : 0;
      const clients = cliRes.status === 'fulfilled' ? cliRes.value.data?.total || 0 : 0;

      const pending = pendingRes.status === 'fulfilled' ? pendingRes.value.data?.users || [] : [];
      setPendingUsers(pending.slice(0, 5));

      const pendingPays = pendingPayRes.status === 'fulfilled' ? pendingPayRes.value.data || [] : [];
      setPendingPayments(pendingPays.slice(0, 4));

      const allPays = allPayRes.status === 'fulfilled' ? allPayRes.value.data || [] : [];
      const gmv = allPays
        .filter(p => p.status === 'released')
        .reduce((s, p) => s + Number(p.amount), 0);

      const monthlyMap = {};
      allPays.filter(p => p.status === 'released').forEach(p => {
        const month = new Date(p.created_at).toISOString().slice(0, 7);
        monthlyMap[month] = (monthlyMap[month] || 0) + Number(p.amount);
      });
      const sortedMonths = Object.keys(monthlyMap).sort().slice(-12);
      const barValues = sortedMonths.map(m => monthlyMap[m]);
      const maxBar = Math.max(...barValues, 1);
      setGmvBars(barValues.map(v => Math.round((v / maxBar) * 100)));

      const studentsList = studentsListRes.status === 'fulfilled' ? studentsListRes.value.data || [] : [];
      const byUni = {};
      studentsList.forEach(s => {
        const uni = s.university || 'Unknown';
        byUni[uni] = (byUni[uni] || 0) + 1;
      });
      setUniFlow(
        Object.entries(byUni)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );

      setStats({ projects, experts, students, clients, gmv, pending: pending.length });
    }).finally(() => setLoading(false));
  }, []);

  const handleApproveUser = async (id) => {
    setApproving(id);
    try {
      await updateUserStatus(id, 'active');
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }));
      toast.success('User approved');
    } catch { toast.error('Failed to approve'); }
    setApproving(null);
  };

  const handleReleasePayment = async (id) => {
    setApproving(id);
    try {
      await updatePayment(id, { status: 'released', processed_at: new Date().toISOString() });
      setPendingPayments(prev => prev.filter(p => p.id !== id));
      toast.success('Payment released');
    } catch { toast.error('Failed to release'); }
    setApproving(null);
  };

  const statCards = [
    {
      label: 'GMV Released',
      value: `${fmt(stats.gmv)} DZD`,
      icon: TrendingUp,
      sub: 'Total processed payments',
    },
    {
      label: 'Active Projects',
      value: stats.projects,
      icon: FolderOpen,
      sub: 'Currently in progress',
    },
    {
      label: 'Active Users',
      value: stats.experts + stats.students + stats.clients,
      icon: Users,
      sub: `${stats.experts} exp · ${stats.students} stu · ${stats.clients} cli`,
    },
    {
      label: 'Pending Approvals',
      value: stats.pending,
      icon: Star,
      sub: 'Awaiting review',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">
            Platform Operations
          </h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            {loading
              ? 'Loading platform data…'
              : `${stats.pending} pending approvals · ${pendingPayments.length} payments awaiting release`
            }
          </p>
        </div>

        {/* GMV hero card */}
        <div className="flex items-center gap-4 bg-[#f5f3ff] border border-[#ede9fe] rounded-2xl px-6 py-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#ede9fe] flex items-center justify-center">
            <BarChart2 size={22} className="text-[#7c3aed]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#7c3aed] uppercase tracking-widest mb-0.5">
              GMV Released
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#111827]">
                {loading ? '—' : fmt(stats.gmv)}
              </span>
              <span className="text-base font-semibold text-[#9ca3af]">DZD</span>
            </div>
          </div>
          {/* mini bar chart */}
          {!loading && gmvBars.length > 0 && (
            <div className="flex items-end gap-0.5 h-8 ml-2">
              {gmvBars.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[#7c3aed] rounded-sm opacity-60"
                  style={{ height: `${Math.max(h, 8)}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(s => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Left — 2/3 */}
        <div className="col-span-2 space-y-5">

          {/* Approvals queue */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f3ff]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#7c3aed]" />
                <h2 className="font-bold text-[#111827] text-base">Approvals Queue</h2>
                {stats.pending > 0 && (
                  <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                    {stats.pending} pending
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/admin/approvals')}
                className="text-[11px] font-bold text-[#7c3aed] flex items-center gap-1 uppercase tracking-widest"
              >
                See all <ChevronRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="px-6 py-5 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#9ca3af]">No pending approvals.</div>
            ) : (
              <div className="divide-y divide-[#f5f3ff]">
                {pendingUsers.map(u => (
                  <div key={u.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ede9fe] flex items-center justify-center text-sm font-bold text-[#7c3aed] flex-shrink-0">
                      {getInitials(`${u.first_name || ''} ${u.last_name || ''}`)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#111827]">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-[11px] text-[#9ca3af] capitalize">
                        {u.role} · {u.email} · {u.domain?.replace(/_/g, ' ') || '—'}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#9ca3af] flex-shrink-0">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : '—'}
                    </span>
                    <button
                      onClick={() => navigate('/admin/approvals')}
                      className="px-3 py-1.5 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleApproveUser(u.id)}
                      disabled={approving === u.id}
                      className="px-3 py-1.5 bg-[#7c3aed] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                      {approving === u.id ? '…' : 'Approve'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending payments */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f3ff]">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-[#7c3aed]" />
                <h2 className="font-bold text-[#111827] text-base">Payments Pending Release</h2>
                {pendingPayments.length > 0 && (
                  <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                    {pendingPayments.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/admin/payouts')}
                className="text-[11px] font-bold text-[#7c3aed] flex items-center gap-1 uppercase tracking-widest"
              >
                See all <ChevronRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="px-6 py-5 space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#9ca3af]">No payments pending release.</div>
            ) : (
              <div className="divide-y divide-[#f5f3ff]">
                {pendingPayments.map(p => (
                  <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
                      <CreditCard size={14} className="text-[#7c3aed]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#111827] truncate">
                        {p.project_title || p.project_id}
                      </div>
                      <div className="text-[11px] text-[#9ca3af]">
                        {p.recipient_name || '—'} · {Number(p.amount).toLocaleString()} DZD
                      </div>
                    </div>
                    <span className="text-[11px] text-[#9ca3af] flex-shrink-0">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : '—'}
                    </span>
                    <button
                      onClick={() => handleReleasePayment(p.id)}
                      disabled={approving === p.id}
                      className="px-3 py-1.5 bg-[#7c3aed] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                      {approving === p.id ? '…' : 'Release'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">

          {/* AI Co-Admin */}
          <div className="bg-[#1e1b4b] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-white text-sm">System Insight</span>
            </div>
            <p className="text-[13px] text-[#a5b4fc] mb-4 leading-relaxed">
              {loading
                ? 'Loading platform data…'
                : `${stats.experts} experts · ${stats.students} students · ${stats.clients} organisations active on the platform.`
              }
            </p>
            <button
              onClick={() => navigate('/admin/experts')}
              className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest mb-2"
            >
              Review Pipeline
            </button>
            <button
              onClick={() => navigate('/admin/audit-log')}
              className="w-full py-2.5 bg-white/10 text-white text-[11px] font-bold rounded-xl uppercase tracking-widest"
            >
              Audit Log
            </button>
          </div>

          {/* University flow */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-[#7c3aed]" />
              <h3 className="font-bold text-[#111827] text-sm">University Flow</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : uniFlow.length === 0 ? (
              <p className="text-[12px] text-[#9ca3af]">No data yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {uniFlow.map(u => {
                  const max = uniFlow[0].count;
                  return (
                    <div key={u.name}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#6b7280] truncate">{u.name}</span>
                        <span className="text-[#9ca3af] flex-shrink-0 ml-1 font-semibold">{u.count}</span>
                      </div>
                      <div className="h-1.5 bg-[#ede9fe] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7c3aed] rounded-full transition-all duration-700"
                          style={{ width: `${Math.round((u.count / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <h3 className="font-bold text-[#111827] text-sm mb-3">Quick Access</h3>
            <div className="space-y-0.5">
              {[
                { label: 'All Projects', path: '/admin/projects' },
                { label: 'Approvals', path: '/admin/approvals' },
                { label: 'Payouts', path: '/admin/payouts' },
                { label: 'Students', path: '/admin/students' },
                { label: 'Audit Log', path: '/admin/audit-log' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-[#374151] text-left"
                >
                  {label}
                  <ChevronRight size={13} className="text-[#d1d5db]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}