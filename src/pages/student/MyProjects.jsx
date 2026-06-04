import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMyProjects, getProject, getProjectTasks, getProjectTeam, updateTaskStatus, startConversation } from '../../api/student.api';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, ArrowLeft, X, BarChart2, Calendar, Tag, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  open: { label: 'To Do', bg: '#f8fafc', text: '#64748b', dot: '#94a3b8' },
  accepted: { label: 'Accepting', bg: '#faf5ff', text: '#7e22ce', dot: '#a855f7' },
  in_progress: { label: 'In Progress', bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  in_review: { label: 'In Review', bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  completed: { label: 'Completed', bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  done: { label: 'Done', bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  delivered: { label: 'Delivered', bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  cancelled: { label: 'Cancelled', bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span style={{ background: cfg.bg, color: cfg.text }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold">
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full" />
      {cfg.label}
    </span>
  );
}

const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
const domainLabel = (d = '') => d ? d.charAt(0).toUpperCase() + d.slice(1).replace(/_/g, ' ') : '—';

// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskDetailModal({ task, onClose }) {
  if (!task) return null;
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 w-full max-w-md overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <span style={{ background: cfg.bg, color: cfg.text }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-gray-100">
              <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full" />
              {cfg.label}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <h2 className="text-[18px] font-bold text-gray-900 leading-tight">{task.title || task.description}</h2>

            {/* Rejection note */}
            {task.rejection_note && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Revision Required</span>
                </div>
                <p className="text-[13px] text-red-700 leading-relaxed">{task.rejection_note}</p>
              </div>
            )}

            {/* Description */}
            {task.description && task.description !== task.title && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              {task.weight_pct && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BarChart2 size={12} className="text-purple-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weight</span>
                  </div>
                  <span className="text-[15px] font-bold text-purple-600">{task.weight_pct}%</span>
                </div>
              )}
              {task.due_date && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar size={12} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700">
                    {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              {task.domain_tag && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag size={12} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Domain</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700">{domainLabel(task.domain_tag)}</span>
                </div>
              )}
              {task.commit_freq && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commit Freq</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700">{domainLabel(task.commit_freq)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyProjects() {
  const { id } = useParams();
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(id || null);
  const navigate = useNavigate();

  useEffect(() => {
    getMyProjects()
      .then((res) => {
        const projects = res.data || [];
        setActive(projects.filter(p =>
          ['in_progress', 'in_review', 'accepted'].includes(p.status)
        ));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (id) setSelectedProject(id);
  }, [id]);

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading projects...</div>;

  if (selectedProject) {
    return (
      <Workspace
        projectId={selectedProject}
        onClose={() => {
          setSelectedProject(null);
          navigate('/student/projects', { replace: true });
        }}
      />
    );
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">My Projects</h1>
        </div>
        <p className="text-sm text-gray-400 pl-3">Active assignments where you're a contributor.</p>
      </div>

      {active.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-16 text-center">
          <p className="text-gray-400 text-sm mb-4">No active projects yet.</p>
          <button onClick={() => navigate('/student/applications')}
            className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold">
            Browse Projects
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((project) => {
            const pid = project.project_id || project.id;
            const totalTasks = Number(project.total_tasks || 0);
            const completedTasks = Number(project.completed_tasks || 0);
            const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            return (
              <div key={pid} className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
                        {(project.service_type || 'project').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-semibold text-gray-900 mb-1">{project.title}</h3>
                    <p className="text-[13px] text-gray-400">
                      Expert: <span className="text-gray-600 font-medium">{project.expert_name || '—'}</span>
                      {' · '}
                      Client: <span className="text-gray-600 font-medium">{project.client_name || '—'}</span>
                    </p>
                  </div>
                  <button onClick={() => setSelectedProject(pid)}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[13px] font-semibold transition-colors flex-shrink-0">
                    Open workspace →
                  </button>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[12px] text-gray-400 mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold text-gray-600">{completedTasks}/{totalTasks} tasks · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Workspace ────────────────────────────────────────────────────────────────
function Workspace({ projectId, onClose }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    Promise.all([
      getProject(projectId),
      getProjectTasks(projectId),
      getProjectTeam(projectId),
    ])
      .then(([projectRes, tasksRes, teamRes]) => {
        const data = projectRes.data;
        setProject(data);
        setTasks((tasksRes.data || []).filter(t => t.student_id === user?.id));

        // Build team: expert first, then actual students from group_member
        const members = [];
        if (data.expert_id && data.expert_name)
          members.push({ id: data.expert_id, name: data.expert_name, role: 'Expert' });
        (teamRes.data || []).forEach(m => {
          if (m.role !== 'expert')
            members.push({ id: m.id, name: m.name, role: 'Student' });
        });
        setTeam(members);
      })
      .catch(() => toast.error('Failed to load workspace'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingTask(taskId);
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleMessage = async (memberId) => {
    try {
      const res = await startConversation(memberId, projectId);
      const cid = res.data.id || res.data.conversation_id;
      navigate('/student/messages', { state: { conversationId: cid } });
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading workspace...</div>;
  if (!project) return <div className="px-8 py-8 text-sm text-gray-400">Project not found</div>;

  const myCompleted = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const myPct = tasks.length > 0 ? Math.round((myCompleted / tasks.length) * 100) : 0;

  // Count only actual students (not expert)
  const studentCount = team.filter(m => m.role === 'Student').length;

  return (
    <div className="px-8 py-10 max-w-7xl">
      <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-7 hover:text-gray-600 transition-colors">
        <ArrowLeft size={14} /> My Projects
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">{project.title}</h1>
        </div>
        <p className="text-[13px] text-gray-400 pl-3">
          <span className="capitalize">{(project.service_type || '').replace(/_/g, ' ')}</span>
          {project.expert_name && <> · Expert: <span className="text-gray-600 font-medium">{project.expert_name}</span></>}
          {project.client_name && <> · Client: <span className="text-gray-600 font-medium">{project.client_name}</span></>}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Task table */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-gray-900">My Tasks</h2>
              <span className="text-[12px] text-gray-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
            </div>

            {tasks.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">No tasks assigned yet.</div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest w-[38%]">Task</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Weight</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Due</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest w-[180px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => {
                    const isRejected = task.rejection_note && task.status === 'in_progress';
                    return (
                      <tr key={task.id}
                        className={`cursor-pointer transition-colors ${i !== tasks.length - 1 ? 'border-b border-gray-50' : ''} ${isRejected ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-gray-50'}`}
                        onClick={(e) => { if (!e.target.closest('select')) setSelectedTask(task); }}>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isRejected ? 'text-red-700' : 'text-gray-900'}`}>
                              {task.title || task.description}
                            </span>
                            {isRejected && (
                              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          {isRejected && task.rejection_note && (
                            <p className="text-[11px] text-red-500 mt-0.5 truncate max-w-xs">"{task.rejection_note}"</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {task.weight_pct ? (
                            <span className="text-[11px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-md">
                              {task.weight_pct}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-gray-400">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          {task.status === 'open' && (
                            <select value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              disabled={updatingTask === task.id}
                              className="text-[12px] px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 w-full">
                              <option value="open">To Do</option>
                              <option value="in_progress">Start task</option>
                            </select>
                          )}
                          {task.status === 'in_progress' && (
                            <select value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              disabled={updatingTask === task.id}
                              className="text-[12px] px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 w-full">
                              <option value="in_progress">In Progress</option>
                              <option value="in_review">Submit for review</option>
                            </select>
                          )}
                          {(task.status === 'in_review' || task.status === 'completed' || task.status === 'done') && (
                            <StatusBadge status={task.status} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {project.description && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-3">Project description</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">{project.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Progress */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-4">My progress</p>
            <div className="mb-4">
              <div className="flex justify-between text-[12px] text-gray-400 mb-1.5">
                <span>Completion</span>
                <span className="font-semibold text-gray-700">{myPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${myPct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[20px] font-bold text-gray-900">{myCompleted}</p>
                <p className="text-[11px] text-gray-400">Done</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[20px] font-bold text-gray-900">{tasks.length - myCompleted}</p>
                <p className="text-[11px] text-gray-400">Remaining</p>
              </div>
            </div>
          </div>

          {/* Team — using actual members count */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={14} className="text-gray-400" />
              <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest">Team</p>
            </div>
            {team.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-3">No members</p>
            ) : (
              <div className="space-y-3">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-[10px] flex-shrink-0">
                        {initials(member.name)}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-800 leading-tight">{member.name}</p>
                        <p className="text-[11px] text-gray-400">{member.role}</p>
                      </div>
                    </div>
                    <button onClick={() => handleMessage(member.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                      <MessageSquare size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details — no project value, team count from actual members */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest">Details</p>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Team size</p>
              <p className="text-[13px] font-medium text-gray-700">{studentCount} student{studentCount !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Status</p>
              <StatusBadge status={project.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}