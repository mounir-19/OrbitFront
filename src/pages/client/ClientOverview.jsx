import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, TrendingUp, Zap, ChevronRight,
  Clock, MessageSquare, FileText, AlertCircle,
} from 'lucide-react';
import {
  getClientProjects,
  getClientInvoices,
} from '../../api/client.api';
import { useAuthStore } from '../../store/authStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (str = '') =>
  str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const fmt = n => Number(n).toLocaleString('fr-DZ');

const statusLabel = {
  submitted: { text: 'Submitted', color: 'text-[#6b7280]', dot: 'bg-[#9ca3af]' },
  under_review: { text: 'Under Review', color: 'text-amber-600', dot: 'bg-amber-400' },
  accepted: { text: 'Accepted', color: 'text-blue-600', dot: 'bg-blue-400' },
  in_progress: { text: 'In Progress', color: 'text-[#7c3aed]', dot: 'bg-[#7c3aed]' },
  in_review: { text: 'In Review', color: 'text-amber-600', dot: 'bg-amber-400' },
  delivered: { text: 'Delivered', color: 'text-green-600', dot: 'bg-green-500' },
  rejected: { text: 'Rejected', color: 'text-red-600', dot: 'bg-red-500' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, loading }) => (
  <div className="bg-white rounded-2xl border border-[#ede9fe] px-6 py-5 flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
      <Icon size={17} className="text-[#7c3aed]" />
    </div>
    <div>
      <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-1">
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <>
          <div className="text-2xl font-bold text-[#111827] leading-none">{value ?? '—'}</div>
          {sub && <div className="text-[11px] text-[#9ca3af] mt-0.5">{sub}</div>}
        </>
      )}
    </div>
  </div>
);

// ─── Alert Card ───────────────────────────────────────────────────────────────
const AlertCard = ({ bg, avatarBg, initials, title, subtitle, badge, badgeColor, action, onAction }) => (
  <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 mb-3 ${bg}`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarBg}`}>
      {initials}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-[#111827] text-sm truncate">{title}</div>
      <div className="text-[11px] text-[#6b7280] mt-0.5 truncate">{subtitle}</div>
    </div>
    <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full text-white ${badgeColor}`}>
      {badge}
    </span>
    <button
      onClick={onAction}
      className="flex-shrink-0 text-[11px] font-bold text-[#4b5563] uppercase tracking-widest"
    >
      {action}
    </button>
  </div>
);

// ─── Project Card ─────────────────────────────────────────────────────────────
const ProjectCard = ({ project, onClick }) => {
  const id = project.project_id || project.id;
  const totalTasks = Number(project.total_tasks) || 0;
  const completedTasks = Number(project.completed_tasks) || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const st = statusLabel[project.status] || { text: project.status, color: 'text-gray-500', dot: 'bg-gray-400' };
  const initials = getInitials(project.title);

  return (
    <div
      className="bg-white rounded-2xl border border-[#ede9fe] px-6 py-5 cursor-pointer"
      onClick={() => onClick(id)}
    >
      <div className="flex items-center gap-5">
        <div className="w-11 h-11 rounded-xl bg-[#ede9fe] flex items-center justify-center text-sm font-bold text-[#7c3aed] flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[#111827] text-[15px] truncate mb-1">
            {project.title}
            {project.expert_name && (
              <span className="font-normal text-[#9ca3af]"> — {project.expert_name}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mb-2.5">
            <span className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${st.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.text}
            </span>
            {project.total_price && (
              <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                {fmt(project.total_price)} DZD
              </span>
            )}
          </div>
          <div className="h-1.5 bg-[#ede9fe] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7c3aed] transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onClick(id); }}
          className="flex-shrink-0 px-5 py-2 bg-white border border-[#d1d5db] text-[#374151] text-sm font-semibold rounded-xl"
        >
          Open
        </button>
      </div>
    </div>
  );
};

// ─── Invoice Row ──────────────────────────────────────────────────────────────
const InvoiceRow = ({ invoice, onPay }) => {
  const isPending = invoice.status === 'pending';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f5f3ff] last:border-0">
      <div className={`w-1 min-h-[40px] rounded-full flex-shrink-0 mt-0.5 ${isPending ? 'bg-red-500' : 'bg-green-500'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[#111827] truncate">
          {invoice.project_title || 'Invoice'}
        </div>
        <div className="text-[11px] text-[#9ca3af] mt-0.5 uppercase tracking-widest">
          {fmt(invoice.amount)} DZD · {isPending ? 'Due now' : 'Paid'}
        </div>
      </div>
      {isPending && (
        <button
          onClick={() => onPay(invoice)}
          className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-[#7c3aed] text-white rounded-xl"
        >
          Pay
        </button>
      )}
      {!isPending && (
        <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
          <Clock size={11} className="text-green-500" />
        </div>
      )}
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const Empty = ({ text }) => (
  <div className="py-8 text-center text-sm text-[#9ca3af]">{text}</div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientOverview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [state, setState] = useState({
    projects: [],
    invoices: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      getClientProjects(),
      getClientInvoices(),
    ]).then(([projRes, invRes]) => {
      if (cancelled) return;
      setState({
        projects: projRes.status === 'fulfilled' ? (projRes.value?.data || []) : [],
        invoices: invRes.status === 'fulfilled' ? (invRes.value?.data || []) : [],
        loading: false,
        error: null,
      });
    }).catch(err => {
      if (!cancelled) setState(s => ({ ...s, loading: false, error: err.message }));
    });

    return () => { cancelled = true; };
  }, []);

  const { projects, invoices, loading, error } = state;

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeProjects = projects.filter(p => ['in_progress', 'accepted', 'in_review'].includes(p.status));
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const reviewProjects = projects.filter(p => p.status === 'in_review');
  const deliveredCount = projects.filter(p => p.status === 'delivered').length;
  const totalBudget = projects.reduce((s, p) => s + Number(p.total_price || 0), 0);
  const pendingAmount = pendingInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);

  const firstName = user?.first_name || 'there';

  const stats = [
    {
      label: 'Active Projects',
      value: activeProjects.length,
      sub: deliveredCount > 0 ? `${deliveredCount} delivered` : null,
      icon: FolderOpen,
    },
    {
      label: 'Committed Budget',
      value: `${fmt(totalBudget)} DZD`,
      sub: `${projects.length} project${projects.length !== 1 ? 's' : ''}`,
      icon: TrendingUp,
    },
    {
      label: 'Pending Payments',
      value: `${fmt(pendingAmount)} DZD`,
      sub: `${pendingInvoices.length} invoice${pendingInvoices.length !== 1 ? 's' : ''}`,
      icon: Zap,
    },
    {
      label: 'Unread Messages',
      value: '—',
      sub: 'Open messages',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            {loading
              ? 'Loading your workspace...'
              : `${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}${pendingInvoices.length ? ` · ${pendingInvoices.length} payment${pendingInvoices.length !== 1 ? 's' : ''} pending` : ''}.`
            }
          </p>
        </div>

        <button
          onClick={() => navigate('/client/request-project')}
          className="flex items-center gap-2.5 px-5 py-3 bg-[#7c3aed] text-white rounded-2xl text-sm font-bold uppercase tracking-widest"
        >
          <Zap size={15} />
          Request Project
        </button>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={15} />
          Failed to load overview: {error}
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* ── Alerts ────────────────────────────────────────────────────────── */}
      {!loading && pendingInvoices.slice(0, 3).map(inv => (
        <AlertCard
          key={inv.id}
          bg="bg-[#fff7ed] border border-[#fed7aa]"
          avatarBg="bg-[#ea580c]"
          initials={getInitials(inv.project_title || 'INV')}
          title={`Payment due — ${inv.project_title || 'Invoice'}`}
          subtitle={`${fmt(inv.amount)} DZD · Release escrow to unlock deliverables`}
          badge="Pay Now"
          badgeColor="bg-[#ea580c]"
          action="Open"
          onAction={() => navigate('/client/invoices')}
        />
      ))}

      {!loading && reviewProjects.map(p => {
        const pid = p.project_id || p.id;
        return (
          <AlertCard
            key={pid}
            bg="bg-[#f5f3ff] border border-[#ddd6fe]"
            avatarBg="bg-[#7c3aed]"
            initials={getInitials(p.title)}
            title={`Milestone ready — ${p.title}`}
            subtitle={`${p.expert_name || 'Expert'} · Awaiting your sign-off`}
            badge="Review"
            badgeColor="bg-[#7c3aed]"
            action="Open"
            onAction={() => navigate(`/client/projects/${pid}`)}
          />
        );
      })}

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5 mt-2">

        {/* Active Projects — 2/3 */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen size={16} className="text-[#7c3aed]" />
              <h2 className="font-bold text-[#111827] text-base">Your Projects</h2>
              {!loading && activeProjects.length > 0 && (
                <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                  {activeProjects.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/client/projects')}
              className="text-[11px] font-semibold text-[#7c3aed] flex items-center gap-1 uppercase tracking-widest"
            >
              All projects <ChevronRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white border border-[#ede9fe] rounded-2xl">
              <Empty text="No projects yet. Request one and we'll match a team in 24 hours." />
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map(p => (
                <ProjectCard
                  key={p.project_id || p.id}
                  project={p}
                  onClick={id => navigate(`/client/projects/${id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">

          {/* Request Project CTA */}
          <div className="bg-[#1e1b4b] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-white text-sm">Brief Assistant</span>
            </div>
            <p className="text-[13px] text-[#a5b4fc] mb-4 leading-relaxed">
              Describe your project in one sentence. We'll scope it and match a team in 24 hours.
            </p>
            <button
              onClick={() => navigate('/client/request-project')}
              className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest mb-2"
            >
              Request Project
            </button>
            <button
              onClick={() => navigate('/client/projects')}
              className="w-full py-2.5 bg-white/10 text-white text-[11px] font-bold rounded-xl uppercase tracking-widest"
            >
              View All Projects
            </button>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#7c3aed]" />
                <h3 className="font-bold text-[#111827] text-sm">Recent Invoices</h3>
              </div>
              {!loading && pendingInvoices.length > 0 && (
                <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                  {pendingInvoices.length} due
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : invoices.length === 0 ? (
              <Empty text="No invoices yet." />
            ) : (
              <div>
                {invoices.slice(0, 4).map(inv => (
                  <InvoiceRow
                    key={inv.id}
                    invoice={inv}
                    onPay={() => navigate('/client/invoices')}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/client/invoices')}
              className="w-full mt-4 pt-3 border-t border-[#f5f3ff] text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest text-center block"
            >
              All Invoices
            </button>
          </div>

          {/* Quick Access */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <h3 className="font-bold text-[#111827] text-sm mb-3">Quick Access</h3>
            <div className="space-y-0.5">
              {[
                { label: 'Messages', path: '/client/messages' },
                { label: 'My Team', path: '/client/team' },
                { label: 'Invoices', path: '/client/invoices' },
                { label: 'Settings', path: '/client/settings' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-[#374151] text-left"
                >
                  {label}
                  <ChevronRight size={14} className="text-[#d1d5db]" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}