import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Users, TrendingUp,
  Clock, ChevronRight, Zap, BarChart2,
  Video, Star, Award,
} from 'lucide-react';
import {
  getProjects,
  getApplications,
  getInterviews,
} from '../../api/expert.api';
import { useAuthStore } from '../../store/authStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (str = '') =>
  str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, loading }) => (
  <div className="bg-white rounded-2xl border border-[#ede9fe] px-6 py-5 flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
      <Icon size={17} className="text-[#7c3aed]" />
    </div>
    <div>
      <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-1">
        {label}
      </div>
      {loading
        ? <Skeleton className="h-7 w-12" />
        : <div className="text-2xl font-bold text-[#111827] leading-none">{value ?? '—'}</div>
      }
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
const ProjectCard = ({ project, onManage }) => {
  const total = Number(project.total_tasks) || 0;
  const done = Number(project.completed_tasks) || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const students = Number(project.team_size) || 0;
  const initials = getInitials(project.title);

  return (
    <div className="bg-white rounded-2xl border border-[#ede9fe] px-6 py-5">
      <div className="flex items-center gap-5">
        <div className="w-11 h-11 rounded-xl bg-[#ede9fe] flex items-center justify-center text-sm font-bold text-[#7c3aed] flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[#111827] text-[15px] truncate mb-1">
            {project.title}
            {project.client_name && (
              <span className="font-normal text-[#9ca3af]"> — {project.client_name}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mb-2.5">
            <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
              {students} Mentee{students !== 1 ? 's' : ''} Assigned
            </span>
            <span className="text-[11px] font-semibold text-[#7c3aed]">
              {progress}% Towards Completion
            </span>
          </div>
          <div className="h-1.5 bg-[#ede9fe] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7c3aed] transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => onManage(project.project_id || project.id)}
          className="flex-shrink-0 px-5 py-2 bg-white border border-[#d1d5db] text-[#374151] text-sm font-semibold rounded-xl"
        >
          Manage
        </button>
      </div>
    </div>
  );
};

// ─── Interview Row ────────────────────────────────────────────────────────────
const InterviewRow = ({ interview }) => {
  const d = new Date(interview.scheduled_at);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const typeLabel = interview.meeting_link ? 'SYNC' : 'INTERVIEW';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f5f3ff] last:border-0">
      <div className={`w-1 min-h-[40px] rounded-full flex-shrink-0 mt-0.5 ${isToday ? 'bg-[#10b981]' : 'bg-[#7c3aed]'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[#111827] truncate">
          {interview.student_name || 'Interview'}
        </div>
        <div className="text-[11px] text-[#9ca3af] mt-0.5 uppercase tracking-widest">
          {time} · {typeLabel}
        </div>
      </div>
      <div className="w-6 h-6 rounded-full bg-[#f5f3ff] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Clock size={11} className="text-[#7c3aed]" />
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const Empty = ({ text }) => (
  <div className="py-8 text-center text-sm text-[#9ca3af]">{text}</div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ExpertDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [state, setState] = useState({
    projects: [],
    pendingApps: [],
    interviews: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      getProjects(),
      getApplications(null, { status: 'pending' }),
      getInterviews(),
    ]).then(([projRes, appsRes, interviewsRes]) => {
      if (cancelled) return;

      const projects = projRes.status === 'fulfilled'
        ? (projRes.value?.data || []) : [];

      const pendingApps = appsRes.status === 'fulfilled'
        ? (appsRes.value?.data || []).slice(0, 5) : [];

      const now = new Date();
      const interviews = interviewsRes.status === 'fulfilled'
        ? (interviewsRes.value?.data || [])
          .filter(i => i.status === 'scheduled' && new Date(i.scheduled_at) >= now)
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
          .slice(0, 5)
        : [];

      setState({ projects, pendingApps, interviews, loading: false, error: null });
    }).catch(err => {
      if (!cancelled) setState(s => ({ ...s, loading: false, error: err.message }));
    });

    return () => { cancelled = true; };
  }, []);

  const { projects, pendingApps, interviews, loading, error } = state;

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeProjects = projects.filter(p =>
    ['in_progress', 'accepted'].includes(p.status)
  );
  const reviewProjects = projects.filter(p => p.status === 'in_review');
  const deliveredCount = projects.filter(p => p.status === 'delivered').length;
  const successRate = projects.length > 0
    ? Math.round((deliveredCount / projects.length) * 100) : null;
  const totalStudents = projects.reduce((s, p) => s + (Number(p.team_size) || 0), 0);

  const stats = [
    { label: 'Active Projects', value: activeProjects.length, icon: FolderOpen },
    { label: 'Pending Vetting', value: pendingApps.length, icon: Users },
    { label: 'Direct Mentees', value: totalStudents, icon: BarChart2 },
    { label: 'Success Rate', value: successRate !== null ? `${successRate}%` : '—', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8 ">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">
            Expert Control Center
          </h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            Overview of your mentoring portfolios and AI workflows.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#f5f3ff] border border-[#ede9fe] rounded-2xl px-6 py-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#ede9fe] flex items-center justify-center">
            <Star size={22} className="text-[#7c3aed]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#7c3aed] uppercase tracking-widest mb-0.5">
              Success Rate
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#111827]">
                {loading ? '—' : successRate !== null ? `${successRate}%` : '—'}
              </span>
              <span className="text-base font-semibold text-[#9ca3af]">
                {!loading && `${deliveredCount} delivered`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-600">
          Failed to load dashboard: {error}
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* ── Alerts — rendered only when real data exists ───────────────────── */}
      {!loading && pendingApps.map(a => (
        <AlertCard
          key={a.id}
          bg="bg-[#f0fdf4] border border-[#bbf7d0]"
          avatarBg="bg-[#16a34a]"
          initials={getInitials(`${a.first_name || ''} ${a.last_name || ''}`)}
          title={`New Candidate: ${[a.first_name, a.last_name].filter(Boolean).join(' ') || 'Candidate'}`}
          subtitle={`Vetting Interview${a.project_title ? ` · ${a.project_title}` : ''}`}
          badge="Interview Programmed"
          badgeColor="bg-[#16a34a]"
          action="Join"
          onAction={() => navigate('/expert/students')}
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
            title={`Milestone Approval — ${p.title}`}
            subtitle={`${p.client_name || 'Client'} · Ready for expert sign-off`}
            badge="Action Required"
            badgeColor="bg-[#7c3aed]"
            action="Review"
            onAction={() => navigate(`/expert/projects/${pid}`)}
          />
        );
      })}

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5 mt-2">

        {/* Active Portfolios — 2/3 */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen size={16} className="text-[#7c3aed]" />
              <h2 className="font-bold text-[#111827] text-base">Active Portfolios</h2>
              {!loading && activeProjects.length > 0 && (
                <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                  {activeProjects.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/expert/projects')}
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
          ) : activeProjects.length === 0 ? (
            <div className="bg-white border border-[#ede9fe] rounded-2xl">
              <Empty text="No active projects right now. New submissions will appear here." />
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.map(p => (
                <ProjectCard
                  key={p.project_id || p.id}
                  project={p}
                  onManage={id => navigate(`/expert/projects/${id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">

          {/* AI Co-Mentor */}
          <div className="bg-[#1e1b4b] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-white text-sm">AI Co-Mentor</span>
            </div>
            <p className="text-[13px] text-[#a5b4fc] mb-4 leading-relaxed">
              Leverage AI models to simulate project risks or evaluate team composition.
            </p>
            <button
              onClick={() => navigate('/expert/task-breakdown')}
              className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest mb-2"
            >
              Task Breakdown
            </button>
            <button
              onClick={() => navigate('/expert/team-matching')}
              className="w-full py-2.5 bg-white/10 text-white text-[11px] font-bold rounded-xl uppercase tracking-widest"
            >
              Team Matching
            </button>
          </div>

          {/* Upcoming Syncs */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video size={14} className="text-[#7c3aed]" />
                <h3 className="font-bold text-[#111827] text-sm">Upcoming Syncs</h3>
              </div>
              {!loading && interviews.length > 0 && (
                <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                  {interviews.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : interviews.length === 0 ? (
              <Empty text="No upcoming syncs scheduled." />
            ) : (
              <div>
                {interviews.map(i => (
                  <InterviewRow key={i.id} interview={i} />
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/expert/meetings')}
              className="w-full mt-4 pt-3 border-t border-[#f5f3ff] text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest text-center block"
            >
              Manage Schedule
            </button>
          </div>

          {/* Quick Access */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <h3 className="font-bold text-[#111827] text-sm mb-3">Quick Access</h3>
            <div className="space-y-0.5">
              {[
                { label: 'Student Pipeline', path: '/expert/students' },
                { label: 'Chat', path: '/expert/chat' },
                { label: 'My Wallet', path: '/expert/wallet' },
                { label: 'Analytics', path: '/expert/analytics' },
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