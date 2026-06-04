import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, ChevronRight, AlertCircle } from 'lucide-react';
import { getClientProjects } from '../../api/client.api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => Number(n).toLocaleString('fr-DZ');

const getInitials = (str = '') =>
  str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const fmtDate = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  submitted: { label: 'Submitted', pill: 'bg-[#f3f4f6] text-[#6b7280]', dot: 'bg-[#9ca3af]', progress: 5 },
  under_review: { label: 'Under Review', pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400', progress: 15 },
  accepted: { label: 'Accepted', pill: 'bg-blue-50 text-blue-700', dot: 'bg-blue-400', progress: 25 },
  in_progress: { label: 'In Progress', pill: 'bg-[#f5f3ff] text-[#7c3aed]', dot: 'bg-[#7c3aed]', progress: 55 },
  in_review: { label: 'In Review', pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400', progress: 80 },
  delivered: { label: 'Delivered', pill: 'bg-green-50 text-green-700', dot: 'bg-green-500', progress: 100 },
  rejected: { label: 'Rejected', pill: 'bg-red-50 text-red-600', dot: 'bg-red-500', progress: 0 },
  cancelled: { label: 'Cancelled', pill: 'bg-[#f3f4f6] text-[#6b7280]', dot: 'bg-[#9ca3af]', progress: 0 },
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TAB_FILTERS = [
  { label: 'All', key: 'all', match: () => true },
  { label: 'Active', key: 'active', match: p => ['in_progress', 'accepted'].includes(p.status) },
  { label: 'In Review', key: 'review', match: p => p.status === 'in_review' },
  { label: 'Awaiting Payment', key: 'payment', match: p => p.status === 'delivered' },
  { label: 'Delivered', key: 'done', match: p => p.status === 'delivered' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

// ─── Project Row ──────────────────────────────────────────────────────────────
const ProjectRow = ({ project, onOpen }) => {
  const id = project.project_id || project.id;
  const st = STATUS[project.status] || { label: project.status, pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', progress: 0 };
  const prog = Number(project.total_tasks) > 0
    ? Math.round((Number(project.completed_tasks) / Number(project.total_tasks)) * 100)
    : 0;

  const expertInit = getInitials(project.expert_name || '');
  const teamSize = Number(project.team_size) || 0;

  return (
    <div className="grid grid-cols-[2fr_1.6fr_1.4fr_1.2fr_1fr_auto] items-center px-6 py-4 border-b border-[#f5f3ff] last:border-0 hover:bg-[#fafafa] transition-colors group">

      {/* Project */}
      <div className="min-w-0 pr-4">
        <div className="text-sm font-semibold text-[#111827] truncate group-hover:text-[#7c3aed] transition-colors">
          {project.title}
        </div>
        <div className="text-[11px] text-[#9ca3af] mt-0.5 uppercase tracking-widest">
          {project.service_type?.replace(/_/g, ' ')} · Due {fmtDate(project.deadline)}
        </div>
      </div>

      {/* Expert / Team */}
      <div className="flex items-center gap-2.5 min-w-0 pr-4">
        <div className="w-8 h-8 rounded-xl bg-[#ede9fe] flex items-center justify-center text-xs font-bold text-[#7c3aed] flex-shrink-0">
          {expertInit || '?'}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-[#111827] truncate">
            {project.expert_name || 'Unassigned'}
          </div>
          <div className="text-[11px] text-[#9ca3af]">
            {teamSize > 0 ? `+${teamSize} on team` : 'No team yet'}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="pr-4">
        <div className="h-1.5 bg-[#ede9fe] rounded-full overflow-hidden w-28 mb-1">
          <div
            className="h-full bg-[#7c3aed] rounded-full transition-all duration-700"
            style={{ width: `${prog}%` }}
          />
        </div>
        <div className="text-[11px] text-[#9ca3af] font-semibold">{prog}%</div>
      </div>

      {/* Budget */}
      <div className="pr-4">
        <div className="text-sm font-bold text-[#111827]">
          {project.total_price ? `${fmt(project.total_price)} DZD` : '—'}
        </div>
        <div className="text-[11px] text-[#9ca3af]">total budget</div>
      </div>

      {/* Status */}
      <div>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${st.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* Action */}
      <button
        onClick={() => onOpen(id)}
        className="ml-4 flex items-center gap-1 px-4 py-2 bg-white border border-[#ede9fe] text-[#7c3aed] text-[12px] font-bold rounded-xl hover:bg-[#f5f3ff] transition-colors flex-shrink-0"
      >
        Open <ChevronRight size={13} />
      </button>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    getClientProjects()
      .then(res => setProjects(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Counts per tab ─────────────────────────────────────────────────────────
  const counts = TAB_FILTERS.map(t => projects.filter(t.match).length);
  const filtered = projects.filter(TAB_FILTERS[tab].match);

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">
            Projects
          </h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            All projects you've commissioned — active, in review, and delivered.
          </p>
        </div>
        <button
          onClick={() => navigate('/client/request-project')}
          className="flex items-center gap-2 px-5 py-3 bg-[#7c3aed] text-white rounded-2xl text-sm font-bold uppercase tracking-widest"
        >
          + Request Project
        </button>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-5 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={15} /> Failed to load projects: {error}
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 border-b border-[#ede9fe]">
        {TAB_FILTERS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setTab(i)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors rounded-t-xl ${tab === i
              ? 'text-[#7c3aed] border-b-2 border-[#7c3aed] -mb-px'
              : 'text-[#9ca3af] hover:text-[#6b7280]'
              }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === i ? 'bg-[#f5f3ff] text-[#7c3aed]' : 'bg-[#f3f4f6] text-[#9ca3af]'
              }`}>
              {counts[i]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#ede9fe] overflow-hidden">

        {/* Header row */}
        <div className="grid grid-cols-[2fr_1.6fr_1.4fr_1.2fr_1fr_auto] px-6 py-3 bg-[#fafafa] border-b border-[#ede9fe]">
          {['Project', 'Expert / Team', 'Progress', 'Budget', 'Status', ''].map(h => (
            <div key={h} className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="px-6 py-6 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#f5f3ff] flex items-center justify-center mb-3">
              <FolderOpen size={22} className="text-[#7c3aed]" />
            </div>
            <div className="text-sm font-semibold text-[#374151] mb-1">No projects here</div>
            <div className="text-[12px] text-[#9ca3af]">
              {tab === 0
                ? 'Request your first project to get started.'
                : `No projects in the "${TAB_FILTERS[tab].label}" category.`}
            </div>
            {tab === 0 && (
              <button
                onClick={() => navigate('/client/request-project')}
                className="mt-4 px-5 py-2 bg-[#7c3aed] text-white text-[12px] font-bold rounded-xl uppercase tracking-widest"
              >
                Request Project
              </button>
            )}
          </div>
        ) : (
          filtered.map(p => (
            <ProjectRow
              key={p.project_id || p.id}
              project={p}
              onOpen={id => navigate(`/client/projects/${id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}