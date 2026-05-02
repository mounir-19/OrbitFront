import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Filter, Plus, Users, ClipboardList, Bell, CheckCircle, MessageSquare } from 'lucide-react';
import { getProjects, getProject, getProjectTasks, updateTask } from '../../api/expert.api';
import toast from 'react-hot-toast';

const statusColor = {
  in_progress: 'text-green-600',
  under_review: 'text-amber-600',
  accepted: 'text-indigo-600',
  delivered: 'text-blue-600',
  pending: 'text-gray-500',
};

// ─── PROJECTS LIST ────────────────────────────────────────────────────────────
export function ExpertProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then(res => setProjects(res.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} projects across your portfolio.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Filter size={14} /> Filter</button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900"><Plus size={14} /> New project</button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-10">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="border border-gray-200 rounded-xl px-5 py-10 text-center text-sm text-gray-400">No projects assigned yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map(p => {
            const id = p.project_id || p.id;
            const initials = (p.title || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={id} className="border border-gray-200 rounded-xl px-6 py-5 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => navigate(`/expert/projects/${id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{p.title}</div>
                      <div className="text-sm text-gray-500 capitalize">{p.service_type?.replace(/_/g, ' ')} · {p.client_name || '—'}</div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${statusColor[p.status] || 'text-gray-500'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />{p.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Users size={11} /> {p.team_size || 0} members</span>
                  <span className="flex items-center gap-1"><ClipboardList size={11} /> tasks</span>
                  {p.total_price && <span>{Number(p.total_price).toLocaleString()} DZD</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PROJECT DETAIL ───────────────────────────────────────────────────────────
export function ExpertProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProject(id)
      .then(res => setProject(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading project...</div>;
  if (!project) return <div className="px-8 py-8 text-sm text-gray-400">Project not found.</div>;

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/expert/projects')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> Projects
        </button>
        <div className="flex gap-2">
          <button onClick={() => navigate('/expert/agenda')} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Bell size={14} /> Request meeting
          </button>
          <button onClick={() => navigate(`/expert/projects/${id}/tasks`)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">
            <ClipboardList size={14} /> Open tasks
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.title}</h1>
      <p className="text-sm text-gray-500 mb-6 capitalize">{project.client_name} · {project.service_type?.replace(/_/g, ' ')} · Started {project.started_at ? new Date(project.started_at).toLocaleDateString() : '—'}</p>

      <div className="border border-gray-200 rounded-xl px-6 py-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Overview</h2>
        <p className="text-sm text-gray-600 mb-4">{project.description || 'No description provided.'}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'CLIENT', value: project.client_name || '—' },
            { label: 'TYPE', value: project.service_type?.replace(/_/g, ' ') },
            { label: 'STATUS', value: project.status?.replace(/_/g, ' '), badge: true },
            { label: 'TEAM', value: `${project.team_size || 0} members` },
            { label: 'BUDGET', value: project.total_price ? `${Number(project.total_price).toLocaleString()} DZD` : '—' },
            { label: 'TASKS', value: `${project.tasks?.length || 0} total` },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 flex-shrink-0">{r.label}</span>
              {r.badge
                ? <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium capitalize">{r.value}</span>
                : <span className="text-sm text-gray-700 capitalize">{r.value}</span>
              }
            </div>
          ))}
        </div>
      </div>

      {project.expert_notes && (
        <div className="border border-gray-200 rounded-xl px-6 py-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-2">Expert notes</h2>
          <p className="text-sm text-gray-600">{project.expert_notes}</p>
        </div>
      )}

      <div className="border border-gray-200 rounded-xl px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Progress</h2>
          <button onClick={() => navigate(`/expert/projects/${id}/tasks`)} className="text-sm text-indigo-600 hover:underline">Open tasks</button>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full"
            style={{ width: project.status === 'delivered' ? '100%' : project.status === 'under_review' ? '80%' : project.status === 'in_progress' ? '50%' : '10%' }} />
        </div>
      </div>
    </div>
  );
}

// ─── TASKS KANBAN ─────────────────────────────────────────────────────────────
const colColors = { open: 'text-gray-500', in_progress: 'text-blue-600', in_review: 'text-amber-600', done: 'text-green-600' };
const COLS = ['open', 'in_progress', 'in_review', 'done'];
const COL_LABELS = { open: 'OPEN', in_progress: 'IN PROGRESS', in_review: 'IN REVIEW', done: 'DONE' };

export function ExpertTasks() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tasksByCol, setTasksByCol] = useState({ open: [], in_progress: [], in_review: [], done: [] });
  const [projectTitle, setProjectTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    Promise.allSettled([getProjectTasks(id), getProject(id)]).then(([tasksRes, projRes]) => {
      if (tasksRes.status === 'fulfilled') {
        const tasks = tasksRes.value.data || [];
        const grouped = { open: [], in_progress: [], in_review: [], done: [] };
        tasks.forEach(t => { if (grouped[t.status]) grouped[t.status].push(t); else grouped.open.push(t); });
        setTasksByCol(grouped);
      }
      if (projRes.status === 'fulfilled') setProjectTitle(projRes.value.data?.title || '');
    }).finally(() => setLoading(false));
  }, [id]);

  const moveTask = async (taskId, newStatus) => {
    setUpdating(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
      setTasksByCol(prev => {
        const all = Object.values(prev).flat();
        const task = all.find(t => t.id === taskId);
        if (!task) return prev;
        const next = { ...prev };
        Object.keys(next).forEach(col => { next[col] = next[col].filter(t => t.id !== taskId); });
        next[newStatus] = [...(next[newStatus] || []), { ...task, status: newStatus }];
        return next;
      });
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot update task');
    } finally {
      setUpdating(null);
    }
  };

  const total = Object.values(tasksByCol).flat().length;
  const done = tasksByCol.done.length;
  const inProg = tasksByCol.in_progress.length;

  return (
    <div className="px-8 py-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(`/expert/projects/${id}`)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
          <ArrowLeft size={13} /> {projectTitle || 'Project'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500">{total} tasks · {done} done · {inProg} in progress</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Filter size={14} /> Filter</button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900"><Plus size={14} /> Add task</button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-10">Loading tasks...</div>
      ) : (
        <div className="flex gap-4 mt-4 flex-1 overflow-x-auto">
          {COLS.map(col => (
            <div key={col} className="w-64 flex-shrink-0 bg-gray-50 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${colColors[col]}`}>{COL_LABELS[col]}</span>
                <span className="text-xs text-gray-400 font-medium">{tasksByCol[col]?.length || 0}</span>
              </div>
              {tasksByCol[col]?.map(task => (
                <div key={task.id} className="bg-white border border-gray-200 rounded-lg px-3 py-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium text-gray-900 mb-2 leading-snug">{task.title}</div>
                  {task.description && <div className="text-xs text-gray-400 mb-2 truncate">{task.description}</div>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                        {task.assigned_to ? task.assigned_to.split(' ').map(w => w[0]).join('').slice(0, 2) : '—'}
                      </div>
                      <span className="text-xs text-gray-400">{task.weight_pct}%</span>
                    </div>
                    {/* Move buttons */}
                    <div className="flex gap-1">
                      {col !== 'done' && (
                        <button onClick={() => moveTask(task.id, COLS[COLS.indexOf(col) + 1])}
                          disabled={updating === task.id}
                          className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 disabled:opacity-50">
                          <CheckCircle size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {col === 'open' && showAdd && (
                <div className="bg-white border border-indigo-300 rounded-lg px-3 py-2">
                  <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') setShowAdd(false); }}
                    placeholder="Task title..." className="w-full text-sm outline-none" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setShowAdd(false)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded">Add</button>
                    <button onClick={() => setShowAdd(false)} className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}