import { useState, useEffect } from 'react';
import {
  Briefcase, Users, Sparkles,
  ArrowLeft, Check, Clock, Zap, SendHorizonal,
} from 'lucide-react';
import { getProjectBoard, getProject, applyToProject, getMyApplications, withdrawApplication } from '../../api/student.api';
import toast from 'react-hot-toast';

// ─── Maps ─────────────────────────────────────────────────────────────────────
const SERVICE_LABEL = {
  web_dev: 'Web Development',
  mobile_dev: 'Mobile Development',
  ui_ux_design: 'UI / UX Design',
  video_editing: 'Video Editing',
  backend_dev: 'Backend / AI',
  ai_ml: 'AI / ML',
};

const SERVICE_COLORS = {
  web_dev: { bg: '#eef2ff', text: '#4338ca' },
  mobile_dev: { bg: '#f5f3ff', text: '#6d28d9' },
  ui_ux_design: { bg: '#fdf2f8', text: '#be185d' },
  video_editing: { bg: '#ecfdf5', text: '#047857' },
  backend_dev: { bg: '#e0f2fe', text: '#0369a1' },
  ai_ml: { bg: '#fffbeb', text: '#b45309' },
};

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', bg: '#f8fafc', text: '#64748b', dot: '#94a3b8' },
  accepted: { label: 'Accepting', bg: '#faf5ff', text: '#7e22ce', dot: '#a855f7' },
  in_progress: { label: 'In progress', bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  in_review: { label: 'In review', bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  delivered: { label: 'Delivered', bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  cancelled: { label: 'Cancelled', bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
};

const APP_STATUS_CONFIG = {
  pending: { label: 'Pending', bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  selected: { label: 'Selected', bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  rejected: { label: 'Rejected', bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
  withdrawn: { label: 'Withdrawn', bg: '#f8fafc', text: '#64748b', dot: '#94a3b8' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalize = (p) => ({ ...p, id: p.id ?? p.project_id });
const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

// ─── Atoms ────────────────────────────────────────────────────────────────────
function StatusDot({ status, config = STATUS_CONFIG }) {
  const cfg = config[status] || { label: status, bg: '#f8fafc', text: '#64748b', dot: '#94a3b8' };
  return (
    <span style={{ background: cfg.bg, color: cfg.text }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide">
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
      {cfg.label}
    </span>
  );
}

function ServiceTag({ type }) {
  const label = SERVICE_LABEL[type] || (type || 'Project').replace(/_/g, ' ');
  const clr = SERVICE_COLORS[type] || { bg: '#f5f5f5', text: '#555' };
  return (
    <span style={{ background: clr.bg, color: clr.text }}
      className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide">
      {label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Applications() {
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [detailProject, setDetailProject] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [applying, setApplying] = useState(false);
  const [activePanel, setActivePanel] = useState('board'); // 'board' | 'applied'

  useEffect(() => {
    Promise.allSettled([getProjectBoard(), getMyApplications()])
      .then(([projRes, appRes]) => {
        const apps = appRes.status === 'fulfilled' ? (appRes.value.data || []) : [];
        const ids = new Set(apps.map(a => a.project_id ?? a.id));
        if (projRes.status === 'fulfilled')
          setProjects((projRes.value.data || []).map(normalize));
        setApplications(apps);
        setAppliedIds(ids);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleViewDetails = async (projectId) => {
    if (!projectId) return;
    setDetailProject(null);
    setDetailLoading(true);
    setActiveTab('overview');
    try {
      const res = await getProject(projectId);
      setDetailProject(normalize(res.data));
    } catch {
      const fallback = projects.find(p => p.id === projectId)
        || applications.find(a => (a.project_id ?? a.id) === projectId);
      setDetailProject(fallback || null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApply = async (projectId) => {
    if (applying || appliedIds.has(projectId)) return;
    setApplying(true);
    try {
      const res = await applyToProject(projectId, {});
      // move project from board to applied panel
      const project = projects.find(p => p.id === projectId);
      setAppliedIds(prev => new Set([...prev, projectId]));
      setApplications(prev => [...prev, { ...(res.data || {}), project_id: projectId, status: 'pending', _project: project }]);
      toast.success('Application submitted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-6 h-6 border-[1.5px] border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (detailProject) {
    return (
      <DetailView
        project={detailProject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isApplied={appliedIds.has(detailProject.id)}
        applying={applying}
        onApply={() => handleApply(detailProject.id)}
        onBack={() => setDetailProject(null)}
      />
    );
  }

  // available projects = not yet applied to
  const availableProjects = projects.filter(p => !appliedIds.has(p.id));

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Applications</h1>
        </div>
        <p className="text-sm text-gray-400 pl-3">Browse open projects and track your applications.</p>
      </div>

      {/* Panel tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-100 pb-0">
        <button
          onClick={() => setActivePanel('board')}
          className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${activePanel === 'board' ? 'text-gray-900' : 'text-gray-400'
            }`}
        >
          Project Board
          <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[11px] font-semibold rounded-full">
            {availableProjects.length}
          </span>
          {activePanel === 'board' && (
            <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-violet-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActivePanel('applied')}
          className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${activePanel === 'applied' ? 'text-gray-900' : 'text-gray-400'
            }`}
        >
          My Applications
          <span className={`ml-2 px-1.5 py-0.5 text-[11px] font-semibold rounded-full ${applications.length > 0 ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
            }`}>
            {applications.length}
          </span>
          {activePanel === 'applied' && (
            <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-violet-500 rounded-full" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-[1.5px] border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activePanel === 'board' ? (
        // ── Board panel ──
        availableProjects.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Briefcase size={20} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No projects available right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {availableProjects.map((project, idx) => (
              <ProjectCard
                key={project.id || idx}
                project={project}
                applying={applying}
                onApply={() => handleApply(project.id)}
                onViewDetails={() => handleViewDetails(project.id)}
              />
            ))}
          </div>
        )
      ) : (
        // ── Applied panel ──
        applications.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <SendHorizonal size={20} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">You haven't applied to any projects yet.</p>
            <button
              onClick={() => setActivePanel('board')}
              className="text-xs text-violet-500 font-semibold mt-1"
            >
              Browse projects →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {applications.map((app, idx) => (
              <ApplicationCard
                key={app.id || idx}
                app={app}
                projects={projects}
                onViewDetails={() => handleViewDetails(app.project_id ?? app.id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── Project Card (board) ─────────────────────────────────────────────────────
function ProjectCard({ project, applying, onApply, onViewDetails }) {
  const skills = project.required_skills || project.skills || [];
  const expertName = project.expert_name;

  return (
    <div
      onClick={onViewDetails}
      className="bg-white border border-gray-100 rounded-2xl cursor-pointer overflow-hidden"
    >
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 mb-3">
              <ServiceTag type={project.service_type} />
              <StatusDot status={project.status} />
              {project.total_price && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 text-gray-500 text-[11px] font-semibold border border-gray-100">
                  {Number(project.total_price).toLocaleString()} DZD
                </span>
              )}
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 leading-snug mb-1 truncate">
              {project.title}
            </h2>
            <p className="text-xs text-gray-400 font-medium">{project.client_name || 'Client'}</p>
          </div>

          <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={onApply}
              disabled={applying}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 active:scale-95 text-white shadow-sm transition-all duration-150"
            >
              <Zap size={11} strokeWidth={2.5} /> Apply
            </button>
          </div>
        </div>

        {project.description && (
          <p className="text-[13px] text-gray-400 leading-relaxed mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {project.team_size && (
              <span className="flex items-center gap-1 text-[12px] text-gray-400">
                <Users size={11} className="text-gray-300" /> {project.team_size} devs
              </span>
            )}
            {project.total_tasks > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-gray-400">
                <Clock size={11} className="text-gray-300" />
                {project.completed_tasks}/{project.total_tasks} tasks
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {skills.slice(0, 3).map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md text-[11px] text-gray-500 font-medium">{s}</span>
            ))}
            {skills.length > 3 && <span className="text-[11px] text-gray-400 font-medium">+{skills.length - 3}</span>}
          </div>
        </div>

        {expertName && (
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-[9px]">
              {initials(expertName)}
            </div>
            <p className="text-[12px] text-gray-400">
              <span className="text-gray-500 font-medium">{expertName}</span>
              {project.expert_title && <span className="text-gray-300"> · {project.expert_title}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Application Card (my applications) ──────────────────────────────────────
function ApplicationCard({ app, projects, onViewDetails }) {
  // try to get project data from the app object or from projects list
  const project = app._project || projects.find(p => p.id === (app.project_id ?? app.id));
  const title = app.project_title || project?.title || 'Project';
  const serviceType = app.service_type || project?.service_type;
  const clientName = app.client_name || project?.client_name;
  const expertName = app.expert_name || project?.expert_name;
  const totalPrice = app.total_price || project?.total_price;
  const appliedAt = app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div
      onClick={onViewDetails}
      className="bg-white border border-gray-100 rounded-2xl cursor-pointer overflow-hidden"
    >
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 mb-3">
              {serviceType && <ServiceTag type={serviceType} />}
              <StatusDot status={app.status || 'pending'} config={APP_STATUS_CONFIG} />
              {totalPrice && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 text-gray-500 text-[11px] font-semibold border border-gray-100">
                  {Number(totalPrice).toLocaleString()} DZD
                </span>
              )}
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 leading-snug mb-1 truncate">{title}</h2>
            <p className="text-xs text-gray-400 font-medium">{clientName || 'Client'}</p>
          </div>

          {appliedAt && (
            <div className="flex-shrink-0 text-right">
              <p className="text-[11px] text-gray-300 mb-0.5">Applied</p>
              <p className="text-[12px] text-gray-500 font-medium">{appliedAt}</p>
            </div>
          )}
        </div>

        {expertName && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
            <div className="w-6 h-6 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-[9px]">
              {initials(expertName)}
            </div>
            <p className="text-[12px] text-gray-400">
              <span className="text-gray-500 font-medium">{expertName}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────
function DetailView({ project, activeTab, setActiveTab, isApplied, applying, onApply, onBack }) {
  const TABS = [
    { id: 'overview', label: 'Overview', ai: false },
    { id: 'tasks', label: 'Task breakdown', ai: true },
    { id: 'team', label: 'Team', ai: true },
  ];

  const skills = project.required_skills || project.skills || [];
  const requirements = project.requirements || [];
  const tasks = project.tasks || [];
  const teamMembers = project.team_members || [];

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-10">
      {/* Back button — clean, no hover effects */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-7"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        {/* Header */}
        <div className="px-8 pt-8 pb-0 border-b border-gray-100">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <ServiceTag type={project.service_type} />
                <StatusDot status={project.status} />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 leading-tight mb-2">{project.title}</h1>
              <div className="flex items-center gap-4 text-[13px] text-gray-400 flex-wrap">
                {project.client_name && (
                  <span className="flex items-center gap-1.5"><Briefcase size={13} /> {project.client_name}</span>
                )}
                {project.team_size && (
                  <span className="flex items-center gap-1.5"><Users size={13} /> Team of {project.team_size}</span>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <button
                onClick={onApply}
                disabled={isApplied || applying}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${isApplied
                  ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-default'
                  : 'bg-violet-600 hover:bg-violet-700 active:scale-95 text-white shadow-sm'
                  }`}
              >
                {isApplied ? '✓ Applied' : applying ? 'Submitting…' : 'Apply for project'}
              </button>
              {!isApplied && <p className="text-[11px] text-gray-300">One active application at a time.</p>}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-400'
                  }`}
              >
                {tab.label}
                {tab.ai && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-500 text-[10px] font-bold rounded-full">
                    <Sparkles size={8} /> AI
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-violet-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-8 bg-[#fafafa] min-h-80">

          {activeTab === 'overview' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div>
                  <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-3">Description</p>
                  <p className="text-[14px] text-gray-500 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>
                {requirements.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-3">Requirements</p>
                    <ul className="space-y-2.5">
                      {requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-500">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {skills.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-3">Skills needed</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-violet-50 text-violet-600 text-[11px] font-semibold rounded-lg">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {project.expert_name && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-3">Expert mentor</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-[11px] flex-shrink-0">
                        {initials(project.expert_name)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">{project.expert_name}</p>
                        {project.expert_title && <p className="text-[11px] text-gray-400">{project.expert_title}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {project.total_price && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-2">Project value</p>
                    <p className="text-xl font-bold text-gray-900 tracking-tight">
                      {Number(project.total_price).toLocaleString()}
                      <span className="text-sm font-semibold text-gray-400 ml-1">DZD</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Your share: 30% split by task weight</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-4">AI-generated task breakdown</p>
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
                    <Sparkles size={18} className="text-violet-300" />
                  </div>
                  <p className="text-[13px] text-gray-400 text-center max-w-xs leading-relaxed">
                    AI-generated task breakdown will appear here once the project scope is confirmed.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task, i) => (
                    <div key={task.id || i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-4">
                      <div className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-400 flex-shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-gray-800">{task.title || task.description}</p>
                          {task.weight_pct && (
                            <span className="text-[11px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-md flex-shrink-0">
                              {task.weight_pct}%
                            </span>
                          )}
                        </div>
                        {task.description && task.title && (
                          <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div>
              <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-4">AI-suggested team</p>
              {teamMembers.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
                    <Sparkles size={18} className="text-violet-300" />
                  </div>
                  <p className="text-[13px] text-gray-400 text-center max-w-xs leading-relaxed">
                    AI-suggested team composition will appear here once applications close.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {teamMembers.map((member, i) => (
                    <div key={member.id || i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-[11px] flex-shrink-0">
                        {initials(member.name)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">{member.name}</p>
                        <p className="text-[11px] text-gray-400 capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}