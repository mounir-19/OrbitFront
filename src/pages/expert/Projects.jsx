import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Users, Star, MessageSquare, Zap,
  Shield, ClipboardList, Video, ChevronRight,
  Plus, CheckCircle, Circle, AlertTriangle, X,
  Loader2, Calendar, Percent,
} from 'lucide-react';
import {
  getProjects,
  getProject,
  getProjectTasks,
  getApplications,
  getRatings,
  getStudentsList,
  startConversation,
  updateTask,
  createTask,
  runTaskBreakdown,
  approveTaskBreakdown,
  runTeamMatching,
} from '../../api/expert.api';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (str = '') =>
  str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const domainLabel = (d = '') =>
  d ? d.charAt(0).toUpperCase() + d.slice(1).replace(/_/g, ' ') : '—';

// Fetch project team members via /api/projects/:id/team
const getProjectTeam = (id) => api.get(`/projects/${id}/team`);

const STATUS_CFG = {
  open: { label: 'Open', dot: 'bg-[#d1d5db]', text: 'text-[#9ca3af]' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-400', text: 'text-blue-600' },
  accepted: { label: 'Accepted', dot: 'bg-[#7c3aed]', text: 'text-[#7c3aed]' },
  in_review: { label: 'In Review', dot: 'bg-amber-400', text: 'text-amber-600' },
  delivered: { label: 'Delivered', dot: 'bg-emerald-400', text: 'text-emerald-600' },
  under_review: { label: 'Under Review', dot: 'bg-amber-400', text: 'text-amber-600' },
  pending: { label: 'Pending', dot: 'bg-[#d1d5db]', text: 'text-[#9ca3af]' },
  done: { label: 'Done', dot: 'bg-emerald-400', text: 'text-emerald-600' },
};

const StatusDot = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

// ─── ADD TASK MODAL ───────────────────────────────────────────────────────────
function AddTaskModal({ projectId, projectDomain, teamMembers, onClose, onAdded }) {
  const [tab, setTab] = useState('manual'); // 'manual' | 'ai'

  // Manual tab state
  const [form, setForm] = useState({
    title: '', description: '', weight_pct: '', due_date: '',
    commit_freq: 'weekly', domain_tag: projectDomain || 'other',
    student_id: '',
  });
  const [saving, setSaving] = useState(false);

  // AI tab state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTasks, setAiTasks] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  const handleManualSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.weight_pct || isNaN(Number(form.weight_pct))) return toast.error('Weight % is required');
    setSaving(true);
    try {
      await createTask(projectId, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        weight_pct: Number(form.weight_pct),
        commit_freq: form.commit_freq || null,
        due_date: form.due_date || null,
        domain_tag: form.domain_tag || null,
        student_id: form.student_id || null,
        ai_proposed: false,
      });
      toast.success('Task created');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error('Describe what you need');
    setAiLoading(true);
    setAiTasks(null);
    try {
      console.log('AI payload:', {        // ← add this
        project_id: projectId,
        scope_summary: aiPrompt,
        team_size: teamMembers.length || 1,
        deadline: null,
        domain: projectDomain || 'other',
      });
      const res = await runTaskBreakdown({
        project_id: projectId,
        scope_summary: aiPrompt,
        team_size: teamMembers.length || 1,
        domain: projectDomain || 'other',
        team_members: teamMembers.map(m => ({
          id: m.id,
          name: m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
          domain: m.domain,
        })),
      });
      setAiTasks(res.data?.tasks || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI failed, try again');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiApprove = async () => {
    if (!aiTasks?.length) return;
    setApproving(true);
    try {
      await approveTaskBreakdown(projectId, aiTasks);
      toast.success('AI tasks saved to project');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save tasks');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ede9fe] w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f3ff]">
          <div className="flex items-center gap-1 bg-[#f5f3ff] rounded-xl p-1">
            <button
              onClick={() => setTab('manual')}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all
                ${tab === 'manual' ? 'bg-white text-[#7c3aed] shadow-sm' : 'text-[#9ca3af]'}`}
            >
              Manual
            </button>
            <button
              onClick={() => setTab('ai')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all
                ${tab === 'ai' ? 'bg-white text-[#7c3aed] shadow-sm' : 'text-[#9ca3af]'}`}
            >
              <Zap size={11} /> AI Generate
            </button>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">

          {tab === 'manual' && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">
                  Task Title *
                </label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Design landing page wireframes"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of what needs to be done…"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] resize-none"
                />
              </div>

              {/* Weight + Due date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">
                    Weight % *
                  </label>
                  <div className="relative">
                    <input
                      type="number" min="1" max="100"
                      value={form.weight_pct}
                      onChange={e => setForm(f => ({ ...f, weight_pct: e.target.value }))}
                      placeholder="20"
                      className="w-full px-4 py-2.5 pr-8 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                    />
                    <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d1d5db]" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                    />
                  </div>
                </div>
              </div>

              {/* Commit freq + Domain tag */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">
                    Commit Frequency
                  </label>
                  <select
                    value={form.commit_freq}
                    onChange={e => setForm(f => ({ ...f, commit_freq: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="every_two_days">Every 2 days</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">
                    Domain Tag
                  </label>
                  <select
                    value={form.domain_tag}
                    onChange={e => setForm(f => ({ ...f, domain_tag: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] bg-white"
                  >
                    <option value="web_dev">Web Dev</option>
                    <option value="mobile_dev">Mobile Dev</option>
                    <option value="ui_ux_design">UI/UX Design</option>
                    <option value="video_editing">Video Editing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Assign to student */}
              <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">
                  Assign To
                </label>
                <select
                  value={form.student_id}
                  onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] bg-white"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {teamMembers.length === 0 && (
                  <p className="text-[11px] text-[#9ca3af] mt-1">No team members selected yet.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-4">
              <div className="bg-[#1e1b4b] rounded-2xl p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#7c3aed] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap size={13} className="text-white" />
                </div>
                <p className="text-[13px] text-[#a5b4fc] leading-relaxed">
                  Describe the project scope or a specific phase. The AI will generate a full task breakdown with weights summing to 100%.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">
                  Scope Description *
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Build the authentication flow: registration, login, password reset, JWT sessions and email verification for a mobile app…"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] resize-none"
                />
              </div>

              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? <><Loader2 size={13} className="animate-spin" /> Generating…</> : 'Generate Tasks'}
              </button>

              {/* AI Results */}
              {aiTasks && (
                <div className="space-y-2 mt-2">
                  <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">
                    {aiTasks.length} tasks generated — review before saving
                  </p>
                  {aiTasks.map((t, i) => (
                    <div key={i} className="bg-[#f5f3ff] border border-[#ede9fe] rounded-xl px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-[#111827]">{t.title}</div>
                          {t.description && (
                            <div className="text-[11px] text-[#6b7280] mt-0.5">{t.description}</div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-bold text-[#7c3aed] bg-white px-2 py-0.5 rounded-full border border-[#ede9fe]">
                              {t.weight_pct}%
                            </span>
                            <span className="text-[10px] text-[#9ca3af]">{t.domain_tag?.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-[#9ca3af]">{t.commit_freq?.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-[#9ca3af]">
                      Total weight: {aiTasks.reduce((s, t) => s + (t.weight_pct || 0), 0)}%
                    </span>
                    <button
                      onClick={handleAiApprove}
                      disabled={approving}
                      className="flex items-center gap-2 px-5 py-2 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest disabled:opacity-50"
                    >
                      {approving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      Save All Tasks
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — manual only */}
        {tab === 'manual' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f5f3ff]">
            <button
              onClick={onClose}
              className="px-5 py-2 text-[11px] font-bold text-[#6b7280] uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : null}
              Create Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROJECTS LIST ─────────────────────────────────────────────────────────────
export function ExpertProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getProjects()
      .then(res => setProjects(res.data || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const filters = ['all', 'in_progress', 'in_review', 'accepted', 'delivered'];
  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  return (
    <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">Projects</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            {loading ? '—' : `${projects.length} projects across your portfolio`}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors
              ${filter === f
                ? 'bg-[#7c3aed] text-white'
                : 'bg-white border border-[#ede9fe] text-[#6b7280]'}`}
          >
            {f === 'all' ? 'All' : domainLabel(f)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#ede9fe] rounded-2xl py-16 text-center">
          <p className="text-sm text-[#9ca3af]">No projects found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const pid = p.project_id || p.id;
            const total = Number(p.total_tasks) || 0;
            const done = Number(p.completed_tasks) || 0;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div
                key={pid}
                onClick={() => navigate(`/expert/projects/${pid}`)}
                className="bg-white border border-[#ede9fe] rounded-2xl px-6 py-5 cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="w-11 h-11 rounded-xl bg-[#ede9fe] flex items-center justify-center text-sm font-bold text-[#7c3aed] flex-shrink-0">
                    {getInitials(p.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-[#111827] text-[15px] truncate">
                        {p.title}
                        {p.client_name && <span className="font-normal text-[#9ca3af]"> — {p.client_name}</span>}
                      </span>
                      {(p.domain || p.service_type) && (
                        <span className="flex-shrink-0 text-[10px] font-semibold text-[#7c3aed] bg-[#f5f3ff] border border-[#ede9fe] px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {domainLabel(p.domain || p.service_type)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-2.5">
                      <StatusDot status={p.status} />
                      <span className="text-[11px] font-semibold text-[#6b7280]">
                        {Number(p.team_size) || 0} mentees
                      </span>
                      {total > 0 && (
                        <span className="text-[11px] font-semibold text-[#7c3aed]">
                          {progress}% complete
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-[#ede9fe] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#7c3aed] rounded-full transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#d1d5db] flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PROJECT DETAIL ────────────────────────────────────────────────────────────
export function ExpertProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [team, setTeam] = useState([]);    // group_member rows
  const [tasks, setTasks] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      getProject(id),
      getProjectTeam(id),
      getProjectTasks(id),
      getRatings({ project_id: id }),
    ]).then(([projRes, teamRes, tasksRes, ratingsRes]) => {
      if (projRes.status === 'fulfilled') setProject(projRes.value?.data);
      if (teamRes.status === 'fulfilled') setTeam(teamRes.value?.data || []);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value?.data || []);
      if (ratingsRes.status === 'fulfilled') setRatings(ratingsRes.value?.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const getRatingFor = (student_id) => {
    const r = ratings.find(r => r.student_id === student_id);
    return r ? Number(r.global_rating || 0).toFixed(1) : null;
  };

  const handleMessage = async (student_id) => {
    try {
      const res = await startConversation(student_id, id);
      const cid = res.data?.id || res.data?.conversation_id;
      navigate('/expert/chat', { state: { conversationId: cid } });
    } catch {
      toast.error('Could not start conversation');
    }
  };

  const handleTeamMatching = async () => {
    setAiLoading(true);
    try {
      const res = await runTeamMatching(id);
      toast.success('AI team suggestion ready');
      navigate('/expert/team-matching', { state: { result: res.data, project_id: id } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI error');
    } finally { setAiLoading(false); }
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8">
        <Skeleton className="h-6 w-32 mb-10" />
        <Skeleton className="h-10 w-96 mb-4" />
        <div className="grid grid-cols-4 gap-5 mt-8">
          <div className="col-span-3 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full" />)}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8">
        <p className="text-sm text-[#9ca3af]">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8">

      {/* ── Top action bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/expert/projects')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest"
        >
          <ArrowLeft size={13} /> Back to Projects
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/expert/meetings')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#ede9fe] text-[#374151] text-[11px] font-bold rounded-xl uppercase tracking-widest"
          >
            <Video size={13} /> Plan Sync
          </button>
          <button
            onClick={() => navigate(`/expert/projects/${id}/tasks`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest"
          >
            <ClipboardList size={13} /> Open Task Board
          </button>
        </div>
      </div>

      {/* ── Title block ────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {project.service_type && (
            <span className="text-[11px] font-bold text-[#9ca3af] bg-[#f5f3ff] border border-[#ede9fe] px-3 py-1 rounded-full uppercase tracking-widest">
              {domainLabel(project.service_type)}
            </span>
          )}
          {project.client_name && (
            <>
              <span className="text-[#d1d5db]">·</span>
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest">
                {project.client_name}
              </span>
            </>
          )}
        </div>
        <h1 className="text-[36px] font-bold text-[#111827] tracking-tight leading-none mb-5">
          {project.title}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md h-2 bg-[#ede9fe] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7c3aed] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[12px] font-semibold text-[#7c3aed]">
            {progress}% · {doneTasks}/{totalTasks} tasks
          </span>
          <StatusDot status={project.status} />
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-5">

        {/* Left — 3/4 */}
        <div className="col-span-3 space-y-6">

          {/* Student Team */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#7c3aed]" />
                <h2 className="font-bold text-[#111827] text-base">Student Team</h2>
                {team.length > 0 && (
                  <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                    {team.length}
                  </span>
                )}
              </div>
              {team.length > 0 && (
                <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">
                  {team.length} Members Assigned
                </span>
              )}
            </div>

            {team.length === 0 ? (
              <div className="bg-white border border-[#ede9fe] rounded-2xl py-10 text-center">
                <p className="text-sm text-[#9ca3af]">No students assigned yet.</p>
                <button
                  onClick={handleTeamMatching}
                  disabled={aiLoading}
                  className="mt-3 px-5 py-2 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest"
                >
                  Run AI Team Matching
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {team.map(member => {
                  const name = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Student';
                  const sid = member.id;
                  const rating = getRatingFor(sid);
                  // Tasks assigned to this student
                  const memberTaskCount = tasks.filter(t => t.student_id === sid).length;

                  return (
                    <div key={sid} className="bg-white border border-[#ede9fe] rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#ede9fe] flex items-center justify-center text-sm font-bold text-[#7c3aed] flex-shrink-0">
                            {getInitials(name)}
                          </div>
                          <div>
                            <div className="font-bold text-[#111827] text-[14px] leading-tight">{name}</div>
                            <div className="text-[11px] text-[#9ca3af] mt-0.5">
                              {memberTaskCount} task{memberTaskCount !== 1 ? 's' : ''} assigned
                            </div>
                          </div>
                        </div>
                        {rating && (
                          <div className="flex items-center gap-1 text-[12px] font-bold text-[#111827]">
                            <Star size={12} className="text-amber-400 fill-amber-400" />
                            {rating}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleMessage(sid)}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest"
                      >
                        <MessageSquare size={12} />
                        Message {name.split(' ')[0]}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tasks overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-[#7c3aed]" />
                <h2 className="font-bold text-[#111827] text-base">Tasks</h2>
                {tasks.length > 0 && (
                  <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate(`/expert/projects/${id}/tasks`)}
                className="text-[11px] font-bold text-[#7c3aed] flex items-center gap-1 uppercase tracking-widest"
              >
                Full board <ChevronRight size={12} />
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-white border border-[#ede9fe] rounded-2xl py-10 text-center">
                <p className="text-sm text-[#9ca3af]">No tasks yet.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
                {tasks.slice(0, 8).map((task, i) => {
                  const isDone = task.status === 'done' || task.status === 'completed';
                  const isReview = task.status === 'in_review';
                  const assignee = task.assigned_to || null;
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 px-6 py-4 ${i !== 0 ? 'border-t border-[#f5f3ff]' : ''}`}
                    >
                      {isDone
                        ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                        : isReview
                          ? <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
                          : <Circle size={15} className="text-[#d1d5db] flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#111827] truncate">{task.title}</div>
                        {assignee && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-4 h-4 rounded-full bg-[#ede9fe] flex items-center justify-center text-[8px] font-bold text-[#7c3aed]">
                              {getInitials(assignee)}
                            </div>
                            <span className="text-[11px] text-[#9ca3af]">{assignee}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {task.weight_pct && (
                          <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                            {task.weight_pct}%
                          </span>
                        )}
                        <StatusDot status={task.status} />
                      </div>
                    </div>
                  );
                })}
                {tasks.length > 8 && (
                  <div className="px-6 py-3 border-t border-[#f5f3ff] text-center">
                    <button
                      onClick={() => navigate(`/expert/projects/${id}/tasks`)}
                      className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest"
                    >
                      View all {tasks.length} tasks
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <div className="bg-white border border-[#ede9fe] rounded-2xl px-6 py-5">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">
                Project Description
              </p>
              <p className="text-[13px] text-[#6b7280] leading-relaxed">{project.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar — 1/4 */}
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
              Analyze team performance or generate the next phase's task breakdown.
            </p>
            <button
              onClick={() => navigate(`/expert/projects/${id}/tasks`)}
              className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest mb-2"
            >
              Generate Tasks
            </button>
            <button
              onClick={handleTeamMatching}
              disabled={aiLoading}
              className="w-full py-2.5 bg-white/10 text-white text-[11px] font-bold rounded-xl uppercase tracking-widest disabled:opacity-60"
            >
              {aiLoading ? 'Matching…' : 'Team Matching'}
            </button>
          </div>

          {/* Expert Toolkit */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-[#7c3aed]" />
              <h3 className="font-bold text-[#111827] text-sm">Expert Toolkit</h3>
            </div>
            <div className="space-y-0.5">
              {[
                { label: 'Rate Students', path: `/expert/projects/${id}/ratings` },
                { label: 'Issue Certificate', path: `/expert/projects/${id}/certificates` },
                { label: 'View Payments', path: '/expert/wallet' },
                { label: 'Task Board', path: `/expert/projects/${id}/tasks` },
              ].map(({ label, path }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-[#374151] text-left"
                >
                  {label}
                  <ChevronRight size={13} className="text-[#d1d5db]" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5 space-y-3">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Details</p>
            {[
              { label: 'Client', value: project.client_name || '—' },
              { label: 'Domain', value: domainLabel(project.service_type || '') },
              { label: 'Team', value: `${team.length || project.team_size || 0} members` },
              { label: 'Budget', value: project.total_price ? `${Number(project.total_price).toLocaleString()} DZD` : '—' },
              { label: 'Started', value: project.started_at ? new Date(project.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
              { label: 'Deadline', value: project.delivered_at ? new Date(project.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">{label}</span>
                <span className="text-[13px] font-semibold text-[#374151] text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TASKS KANBAN ──────────────────────────────────────────────────────────────
const COLS = ['open', 'in_progress', 'in_review', 'done'];
const COL_LABELS = { open: 'Open', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
const COL_DOT = { open: 'bg-[#d1d5db]', in_progress: 'bg-blue-400', in_review: 'bg-amber-400', done: 'bg-emerald-400' };
const COL_TEXT = { open: 'text-[#9ca3af]', in_progress: 'text-blue-500', in_review: 'text-amber-500', done: 'text-emerald-500' };

export function ExpertTasks() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tasksByCol, setTasksByCol] = useState({ open: [], in_progress: [], in_review: [], done: [] });
  const [project, setProject] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.allSettled([
      getProjectTasks(id),
      getProject(id),
      getProjectTeam(id),
    ]).then(([tasksRes, projRes, teamRes]) => {
      if (tasksRes.status === 'fulfilled') {
        const tasks = tasksRes.value.data || [];
        const grouped = { open: [], in_progress: [], in_review: [], done: [] };
        tasks.forEach(t => {
          if (grouped[t.status]) grouped[t.status].push(t);
          else grouped.open.push(t);
        });
        setTasksByCol(grouped);
      }
      if (projRes.status === 'fulfilled') setProject(projRes.value.data || null);
      if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

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
      toast.success('Task moved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot update task');
    } finally { setUpdating(null); }
  };

  const total = Object.values(tasksByCol).flat().length;
  const done = tasksByCol.done.length;

  return (
    <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8 flex flex-col">

      {/* Back + header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(`/expert/projects/${id}`)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest"
        >
          <ArrowLeft size={13} /> {project?.title || 'Project'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">Task Board</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            {total} tasks · {done} done
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest"
        >
          <Plus size={13} /> Add Task
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="flex-1 h-80" />)}
        </div>
      ) : (
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          {COLS.map(col => (
            <div key={col} className="flex-1 min-w-[220px] flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${COL_DOT[col]}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${COL_TEXT[col]}`}>
                    {COL_LABELS[col]}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#9ca3af]">
                  {tasksByCol[col]?.length || 0}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex flex-col gap-2">
                {tasksByCol[col]?.map(task => {
                  const assigneeName = task.assigned_to || null;
                  return (
                    <div
                      key={task.id}
                      className="bg-white border border-[#ede9fe] rounded-2xl px-4 py-4"
                    >
                      <div className="text-[13px] font-semibold text-[#111827] mb-2 leading-snug">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-[11px] text-[#9ca3af] mb-3 line-clamp-2">
                          {task.description}
                        </div>
                      )}

                      {/* Assignee */}
                      {assigneeName ? (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-full bg-[#ede9fe] flex items-center justify-center text-[8px] font-bold text-[#7c3aed] flex-shrink-0">
                            {getInitials(assigneeName)}
                          </div>
                          <span className="text-[11px] text-[#6b7280] truncate">{assigneeName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-full border border-dashed border-[#d1d5db] flex-shrink-0" />
                          <span className="text-[11px] text-[#d1d5db]">Unassigned</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.weight_pct && (
                            <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-1.5 py-0.5 rounded-full">
                              {task.weight_pct}%
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-[10px] text-[#9ca3af]">
                              {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        {col !== 'done' && (
                          <button
                            onClick={() => moveTask(task.id, COLS[COLS.indexOf(col) + 1])}
                            disabled={updating === task.id}
                            className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2.5 py-1 rounded-lg disabled:opacity-50"
                          >
                            {updating === task.id ? '…' : '→'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showModal && (
        <AddTaskModal
          projectId={id}
          projectDomain={project?.service_type}
          teamMembers={team}
          onClose={() => setShowModal(false)}
          onAdded={loadData}
        />
      )}
    </div>
  );
}