import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Users, Star, MessageSquare, Zap,
  Shield, ClipboardList, Video, ChevronRight,
  Plus, CheckCircle, Circle, AlertTriangle, X,
  Loader2, Percent, Edit2, Trash2,
  Send, Lock, Sparkles, Calendar, Tag,
  User, BarChart2, Clock, ChevronLeft, XCircle,
} from 'lucide-react';
import {
  getProjects,
  getProject,
  getProjectTasks,
  getRatings,
  startConversation,
  updateTask,
  createTask,
  deleteTask,
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

const getProjectTeam = (id) => api.get(`/projects/${id}/team`);
const publishTask = (task_id) => api.post(`/tasks/publish/${task_id}`);
const getAiTaskDescription = (title, project_id) =>
  api.post('/ai/task-description', { title, project_id });

const STATUS_CFG = {
  open: { label: 'Open', dot: 'bg-[#d1d5db]', text: 'text-[#9ca3af]', badge: 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-400', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  accepted: { label: 'Accepted', dot: 'bg-[#7c3aed]', text: 'text-[#7c3aed]', badge: 'bg-[#f5f3ff] text-[#7c3aed] border-[#ede9fe]' },
  in_review: { label: 'In Review', dot: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  delivered: { label: 'Delivered', dot: 'bg-emerald-400', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  under_review: { label: 'Under Review', dot: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending: { label: 'Pending', dot: 'bg-[#d1d5db]', text: 'text-[#9ca3af]', badge: 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]' },
  done: { label: 'Done', dot: 'bg-emerald-400', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
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

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

// ─── Weight Bar ───────────────────────────────────────────────────────────────
function WeightBar({ tasks }) {
  const draftTasks = tasks.filter(t => t.is_draft);
  const total = draftTasks.reduce((s, t) => s + parseFloat(t.weight_pct || 0), 0);
  const rounded = Math.round(total * 10) / 10;
  const over = rounded > 100;
  const exact = rounded === 100;

  return (
    <div className="flex items-center gap-3 bg-white border border-[#ede9fe] rounded-xl px-4 py-2.5">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Draft Weight</span>
          <span className={`text-[12px] font-bold ${over ? 'text-red-500' : exact ? 'text-emerald-600' : 'text-[#7c3aed]'}`}>
            {rounded}%
          </span>
        </div>
        <div className="h-1.5 bg-[#f0eeff] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-400' : exact ? 'bg-emerald-500' : 'bg-[#7c3aed]'}`}
            style={{ width: `${Math.min(rounded, 100)}%` }}
          />
        </div>
      </div>
      {over && <span className="text-[10px] font-bold text-red-500 flex-shrink-0">Over by {Math.round(rounded - 100)}%</span>}
      {exact && <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />}
    </div>
  );
}

function MetaCard({ icon, label, children }) {
  return (
    <div className="bg-[#fafafa] border border-[#f3f4f6] rounded-xl px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  );
}

// ─── TASK DETAIL DRAWER ───────────────────────────────────────────────────────
function TaskDetailDrawer({ task, teamMembers, onClose, onEdit, onMove, onReview, moving }) {
  const [rejectionNote, setRejectionNote] = useState('');

  if (!task) return null;

  const COLS = ['open', 'in_progress', 'in_review', 'done'];
  const colIdx = COLS.indexOf(task.status);
  const nextStatus = colIdx < COLS.length - 1 ? COLS[colIdx + 1] : null;
  const prevStatus = colIdx > 0 ? COLS[colIdx - 1] : null;

  const assigneeName = task.assigned_to || null;
  const assigneeMember = teamMembers?.find(m => m.id === task.student_id);
  const isInReview = task.status === 'in_review';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-[420px] bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: '1px solid #ede9fe' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f3ff]">
          <div className="flex items-center gap-2">
            {task.is_draft && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                Draft
              </span>
            )}
            <StatusBadge status={task.status} />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f3ff] text-[#9ca3af] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Title */}
          <h2 className="text-[20px] font-bold text-[#111827] leading-tight">{task.title}</h2>

          {/* Description */}
          {task.description ? (
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Description</p>
              <p className="text-[13px] text-[#374151] leading-relaxed">{task.description}</p>
            </div>
          ) : (
            <div className="bg-[#fafafa] border border-dashed border-[#e5e7eb] rounded-xl px-4 py-3">
              <p className="text-[12px] text-[#d1d5db] text-center">No description added</p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetaCard icon={<BarChart2 size={13} className="text-[#7c3aed]" />} label="Weight">
              <span className="text-[15px] font-bold text-[#7c3aed]">{task.weight_pct ?? '—'}%</span>
            </MetaCard>
            <MetaCard icon={<Calendar size={13} className="text-[#9ca3af]" />} label="Due Date">
              <span className="text-[13px] font-semibold text-[#374151]">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </span>
            </MetaCard>
            <MetaCard icon={<Tag size={13} className="text-[#9ca3af]" />} label="Domain">
              <span className="text-[13px] font-semibold text-[#374151]">{domainLabel(task.domain_tag)}</span>
            </MetaCard>
            <MetaCard icon={<Clock size={13} className="text-[#9ca3af]" />} label="Commit Freq">
              <span className="text-[13px] font-semibold text-[#374151]">
                {task.commit_freq ? domainLabel(task.commit_freq) : '—'}
              </span>
            </MetaCard>
          </div>

          {/* Assignee */}
          <div>
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Assigned To</p>
            {assigneeName ? (
              <div className="flex items-center gap-3 bg-[#f5f3ff] border border-[#ede9fe] rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-[#ede9fe] flex items-center justify-center text-[12px] font-bold text-[#7c3aed] flex-shrink-0">
                  {getInitials(assigneeName)}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#111827]">{assigneeName}</div>
                  {assigneeMember?.domain && (
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">{domainLabel(assigneeMember.domain)}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-[#fafafa] border border-dashed border-[#e5e7eb] rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full border border-dashed border-[#d1d5db] flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-[#d1d5db]" />
                </div>
                <span className="text-[12px] text-[#d1d5db]">Unassigned</span>
              </div>
            )}
          </div>

          {/* ── IN REVIEW: approve or reject with note ── */}
          {!task.is_draft && isInReview && (
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Review Decision</p>

              {/* Rejection note */}
              <div className="mb-3">
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">
                  Rejection Note <span className="text-[#d1d5db]">(required to return)</span>
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={e => setRejectionNote(e.target.value)}
                  placeholder="Describe what needs to be fixed or improved…"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] resize-none"
                />
              </div>

              <div className="flex gap-2">
                {/* Return for revision */}
                <button
                  onClick={() => onReview(task.id, 'in_progress', rejectionNote)}
                  disabled={!rejectionNote.trim() || moving === task.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 bg-red-50 rounded-xl text-[11px] font-bold text-red-600 uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {moving === task.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Return
                </button>
                {/* Approve */}
                <button
                  onClick={() => onReview(task.id, 'done', null)}
                  disabled={moving === task.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-40">
                  {moving === task.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Approve
                </button>
              </div>
            </div>
          )}

          {/* ── Normal move for non-review published tasks ── */}
          {!task.is_draft && !isInReview && (prevStatus || nextStatus) && (
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Move Task</p>
              <div className="flex gap-2">
                {prevStatus && (
                  <button
                    onClick={() => onMove(task.id, prevStatus)}
                    disabled={moving === task.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors disabled:opacity-40">
                    {moving === task.id ? <Loader2 size={12} className="animate-spin" /> : <ChevronLeft size={12} />}
                    {STATUS_CFG[prevStatus]?.label}
                  </button>
                )}
                {nextStatus && (
                  <button
                    onClick={() => onMove(task.id, nextStatus)}
                    disabled={moving === task.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#7c3aed] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-[#6d28d9] transition-colors">
                    {moving === task.id ? <Loader2 size={12} className="animate-spin" /> : null}
                    {STATUS_CFG[nextStatus]?.label}
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer — draft edit button */}
        {task.is_draft && (
          <div className="px-6 py-4 border-t border-[#f5f3ff]">
            <button
              onClick={() => onEdit(task)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">
              <Edit2 size={12} /> Edit Draft
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
function TaskModal({ projectId, projectDomain, teamMembers, editTask, onClose, onSaved }) {
  const isEdit = !!editTask;
  const [tab, setTab] = useState('manual');
  const [form, setForm] = useState({
    title: editTask?.title || '',
    description: editTask?.description || '',
    weight_pct: editTask?.weight_pct ?? '',
    due_date: editTask?.due_date ? editTask.due_date.slice(0, 10) : '',
    commit_freq: editTask?.commit_freq || 'weekly',
    domain_tag: editTask?.domain_tag || projectDomain || 'other',
    student_id: editTask?.student_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [descLoading, setDescLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTasks, setAiTasks] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  const handleAiDescription = async () => {
    if (!form.title.trim()) return toast.error('Enter a title first');
    setDescLoading(true);
    try {
      const res = await getAiTaskDescription(form.title, projectId);
      setForm(f => ({ ...f, description: res.data.description }));
      toast.success('Description generated');
    } catch { toast.error('AI failed, try again'); }
    finally { setDescLoading(false); }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.weight_pct || isNaN(Number(form.weight_pct))) return toast.error('Weight % is required');
    setSaving(true);
    try {
      if (isEdit) {
        await updateTask(editTask.id, {
          title: form.title.trim(),
          description: form.description.trim() || null,
          weight_pct: Number(form.weight_pct),
          commit_freq: form.commit_freq || null,
          due_date: form.due_date || null,
          domain_tag: form.domain_tag || null,
          student_id: form.student_id || null,
        });
        toast.success('Task updated');
      } else {
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
      }
      onSaved(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally { setSaving(false); }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error('Describe what you need');
    setAiLoading(true); setAiTasks(null);
    try {
      const res = await runTaskBreakdown({
        project_id: projectId,
        scope_summary: aiPrompt,
        team_size: teamMembers.length || 1,
        domain: projectDomain || 'other',
        team_members: teamMembers.map(m => ({ id: m.id, name: m.name, domain: m.domain })),
      });
      setAiTasks(res.data?.tasks || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI failed, try again');
    } finally { setAiLoading(false); }
  };

  const handleAiApprove = async () => {
    if (!aiTasks?.length) return;
    setApproving(true);
    try {
      const safeTasks = aiTasks.map(t => ({
        ...t,
        student_id: teamMembers.length > 0 ? t.student_id : null,
      }));
      await approveTaskBreakdown(projectId, safeTasks);
      toast.success('AI tasks saved as drafts');
      onSaved(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save tasks');
    } finally { setApproving(false); }
  };

  const aiWeightTotal = aiTasks?.reduce((s, t) => s + (t.weight_pct || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#ede9fe] w-full max-w-lg mx-0 sm:mx-4 overflow-hidden">

        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-bold text-[#111827]">
              {isEdit ? 'Edit Draft Task' : 'New Task'}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f3ff] text-[#9ca3af] transition-colors">
              <X size={16} />
            </button>
          </div>

          {!isEdit && (
            <div className="flex border-b border-[#f5f3ff] -mx-6 px-6">
              <button
                onClick={() => setTab('manual')}
                className={`pb-3 pr-5 text-[12px] font-bold uppercase tracking-widest border-b-2 transition-all -mb-px ${tab === 'manual' ? 'text-[#7c3aed] border-[#7c3aed]' : 'text-[#9ca3af] border-transparent hover:text-[#6b7280]'}`}>
                Manual
              </button>
              <button
                onClick={() => setTab('ai')}
                className={`pb-3 px-5 text-[12px] font-bold uppercase tracking-widest border-b-2 transition-all -mb-px flex items-center gap-1.5 ${tab === 'ai' ? 'text-[#7c3aed] border-[#7c3aed]' : 'text-[#9ca3af] border-transparent hover:text-[#6b7280]'}`}>
                <Zap size={11} /> AI Generate
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-5 max-h-[68vh] overflow-y-auto">
          {(tab === 'manual' || isEdit) && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">Task Title <span className="text-red-400">*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Design landing page wireframes"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Description</label>
                  <button onClick={handleAiDescription} disabled={descLoading || !form.title.trim()}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2.5 py-1 rounded-lg disabled:opacity-40 hover:bg-[#ede9fe] transition-colors">
                    {descLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI Write
                  </button>
                </div>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of what needs to be done…" rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">Weight % <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input type="number" min="1" max="100" value={form.weight_pct}
                      onChange={e => setForm(f => ({ ...f, weight_pct: e.target.value }))} placeholder="20"
                      className="w-full px-4 py-2.5 pr-8 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]" />
                    <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d1d5db]" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">Commit Freq</label>
                  <select value={form.commit_freq} onChange={e => setForm(f => ({ ...f, commit_freq: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] bg-white">
                    <option value="daily">Daily</option>
                    <option value="every_two_days">Every 2 days</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">Domain</label>
                  <select value={form.domain_tag} onChange={e => setForm(f => ({ ...f, domain_tag: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] bg-white">
                    <option value="web_dev">Web Dev</option>
                    <option value="mobile_dev">Mobile Dev</option>
                    <option value="ui_ux_design">UI/UX Design</option>
                    <option value="video_editing">Video Editing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">Assign To</label>
                <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] bg-white">
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {teamMembers.length === 0 && <p className="text-[11px] text-[#9ca3af] mt-1.5">No team members assigned yet.</p>}
              </div>
            </div>
          )}

          {tab === 'ai' && !isEdit && (
            <div className="space-y-5">
              <div className="bg-[#0f0e1a] rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7c3aed] flex items-center justify-center flex-shrink-0">
                    <Zap size={13} className="text-white" />
                  </div>
                  <span className="text-[13px] font-bold text-white">AI Task Breakdown</span>
                </div>
                <p className="text-[12px] text-[#6d6a8a] leading-relaxed">
                  Describe a scope or deliverable. Claude will generate a structured task breakdown weighted to 100%, saved as drafts for your review before publishing to students.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1.5 block">Scope Description <span className="text-red-400">*</span></label>
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Build the authentication flow: registration, login, password reset, and OTP verification…" rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] resize-none" />
                {teamMembers.length > 0 && (
                  <p className="text-[11px] text-[#9ca3af] mt-1.5 flex items-center gap-1">
                    <Users size={10} /> Tasks will be distributed across {teamMembers.length} team members
                  </p>
                )}
              </div>
              <button onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt.trim()}
                className="w-full py-3 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#6d28d9] transition-colors">
                {aiLoading ? <><Loader2 size={13} className="animate-spin" /> Generating…</> : <><Zap size={13} /> Generate Tasks</>}
              </button>
              {aiTasks && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{aiTasks.length} tasks generated</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${Math.round(aiWeightTotal) === 100 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
                      {aiWeightTotal}% total
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#f0eeff] rounded-full overflow-hidden mb-4">
                    <div className={`h-full rounded-full transition-all duration-500 ${Math.round(aiWeightTotal) === 100 ? 'bg-emerald-500' : 'bg-[#7c3aed]'}`}
                      style={{ width: `${Math.min(aiWeightTotal, 100)}%` }} />
                  </div>
                  <div className="space-y-2">
                    {aiTasks.map((t, i) => {
                      const assignee = teamMembers.find(m => m.id === t.student_id);
                      return (
                        <div key={i} className="bg-[#f9f8ff] border border-[#ede9fe] rounded-xl px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold text-[#111827] mb-0.5">{t.title}</div>
                              {t.description && <div className="text-[11px] text-[#6b7280] leading-relaxed line-clamp-2">{t.description}</div>}
                            </div>
                            <span className="text-[12px] font-bold text-[#7c3aed] bg-white border border-[#ede9fe] px-2.5 py-1 rounded-lg flex-shrink-0">{t.weight_pct}%</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {t.domain_tag && <span className="text-[10px] font-semibold text-[#9ca3af]">{domainLabel(t.domain_tag)}</span>}
                            {assignee && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-full bg-[#ede9fe] flex items-center justify-center text-[8px] font-bold text-[#7c3aed]">{getInitials(assignee.name)}</div>
                                <span className="text-[10px] text-[#9ca3af]">{assignee.name.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#f5f3ff]">
                    <button onClick={() => { setAiTasks(null); setAiPrompt(''); }}
                      className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest px-3 py-2 hover:text-[#6b7280] transition-colors">
                      Regenerate
                    </button>
                    <button onClick={handleAiApprove} disabled={approving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest disabled:opacity-50 hover:bg-[#6d28d9] transition-colors">
                      {approving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Save as Drafts
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {(tab === 'manual' || isEdit) && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f5f3ff]">
            <button onClick={onClose} className="px-5 py-2 text-[11px] font-bold text-[#6b7280] uppercase tracking-widest">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest disabled:opacity-50 hover:bg-[#6d28d9] transition-colors">
              {saving && <Loader2 size={12} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Draft'}
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
          <p className="text-sm text-[#9ca3af] mt-1">{loading ? '—' : `${projects.length} projects across your portfolio`}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors ${filter === f ? 'bg-[#7c3aed] text-white' : 'bg-white border border-[#ede9fe] text-[#6b7280]'}`}>
            {f === 'all' ? 'All' : domainLabel(f)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
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
              <div key={pid} onClick={() => navigate(`/expert/projects/${pid}`)}
                className="bg-white border border-[#ede9fe] rounded-2xl px-6 py-5 cursor-pointer hover:border-[#c4b5fd] transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-11 h-11 rounded-xl bg-[#ede9fe] flex items-center justify-center text-sm font-bold text-[#7c3aed] flex-shrink-0">{getInitials(p.title)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-[#111827] text-[15px] truncate">
                        {p.title}{p.client_name && <span className="font-normal text-[#9ca3af]"> — {p.client_name}</span>}
                      </span>
                      {(p.domain || p.service_type) && (
                        <span className="flex-shrink-0 text-[10px] font-semibold text-[#7c3aed] bg-[#f5f3ff] border border-[#ede9fe] px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {domainLabel(p.domain || p.service_type)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-2.5">
                      <StatusDot status={p.status} />
                      <span className="text-[11px] font-semibold text-[#6b7280]">{Number(p.team_size) || 0} mentees</span>
                      {total > 0 && <span className="text-[11px] font-semibold text-[#7c3aed]">{progress}% complete</span>}
                    </div>
                    <div className="h-1.5 bg-[#ede9fe] rounded-full overflow-hidden">
                      <div className="h-full bg-[#7c3aed] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
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
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      getProject(id), getProjectTeam(id), getProjectTasks(id), getRatings({ project_id: id }),
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
    } catch { toast.error('Could not start conversation'); }
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

  if (loading) return (
    <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8">
      <Skeleton className="h-6 w-32 mb-10" />
      <Skeleton className="h-10 w-96 mb-4" />
      <div className="grid grid-cols-4 gap-5 mt-8">
        <div className="col-span-3 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full" />)}</div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );

  if (!project) return <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8"><p className="text-sm text-[#9ca3af]">Project not found.</p></div>;

  return (
    <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/expert/projects')} className="flex items-center gap-1.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest">
          <ArrowLeft size={13} /> Back to Projects
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/expert/meetings')} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#ede9fe] text-[#374151] text-[11px] font-bold rounded-xl uppercase tracking-widest">
            <Video size={13} /> Plan Sync
          </button>
          <button onClick={() => navigate(`/expert/projects/${id}/tasks`)} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest">
            <ClipboardList size={13} /> Open Task Board
          </button>
        </div>
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {project.service_type && <span className="text-[11px] font-bold text-[#9ca3af] bg-[#f5f3ff] border border-[#ede9fe] px-3 py-1 rounded-full uppercase tracking-widest">{domainLabel(project.service_type)}</span>}
          {project.client_name && <><span className="text-[#d1d5db]">·</span><span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest">{project.client_name}</span></>}
        </div>
        <h1 className="text-[36px] font-bold text-[#111827] tracking-tight leading-none mb-5">{project.title}</h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md h-2 bg-[#ede9fe] rounded-full overflow-hidden">
            <div className="h-full bg-[#7c3aed] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[12px] font-semibold text-[#7c3aed]">{progress}% · {doneTasks}/{totalTasks} tasks</span>
          <StatusDot status={project.status} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-3 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#7c3aed]" />
                <h2 className="font-bold text-[#111827] text-base">Student Team</h2>
                {team.filter(m => m.role === 'student').length > 0 && (
                  <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">{team.filter(m => m.role === 'student').length}</span>
                )}
              </div>
            </div>
            {team.filter(m => m.role === 'student').length === 0 ? (
              <div className="bg-white border border-[#ede9fe] rounded-2xl py-10 text-center">
                <p className="text-sm text-[#9ca3af]">No students assigned yet.</p>
                <button onClick={handleTeamMatching} disabled={aiLoading} className="mt-3 px-5 py-2 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest">Run AI Team Matching</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {team.filter(m => m.role === 'student').map(member => {
                  const name = member.name || 'Student';
                  const sid = member.id;
                  const rating = getRatingFor(sid);
                  const memberTaskCount = tasks.filter(t => t.student_id === sid).length;
                  return (
                    <div key={sid} className="bg-white border border-[#ede9fe] rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#ede9fe] flex items-center justify-center text-sm font-bold text-[#7c3aed] flex-shrink-0">{getInitials(name)}</div>
                          <div>
                            <div className="font-bold text-[#111827] text-[14px] leading-tight">{name}</div>
                            <div className="text-[11px] text-[#9ca3af] mt-0.5">{memberTaskCount} task{memberTaskCount !== 1 ? 's' : ''} assigned</div>
                          </div>
                        </div>
                        {rating && <div className="flex items-center gap-1 text-[12px] font-bold text-[#111827]"><Star size={12} className="text-amber-400 fill-amber-400" />{rating}</div>}
                      </div>
                      <button onClick={() => handleMessage(sid)} className="w-full flex items-center justify-center gap-2 py-2 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest">
                        <MessageSquare size={12} /> Message {name.split(' ')[0]}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-[#7c3aed]" />
                <h2 className="font-bold text-[#111827] text-base">Tasks</h2>
                {tasks.length > 0 && <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">{tasks.length}</span>}
              </div>
              <button onClick={() => navigate(`/expert/projects/${id}/tasks`)} className="text-[11px] font-bold text-[#7c3aed] flex items-center gap-1 uppercase tracking-widest">Full board <ChevronRight size={12} /></button>
            </div>
            {tasks.length === 0 ? (
              <div className="bg-white border border-[#ede9fe] rounded-2xl py-10 text-center"><p className="text-sm text-[#9ca3af]">No tasks yet.</p></div>
            ) : (
              <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
                {tasks.slice(0, 8).map((task, i) => {
                  const isDone = task.status === 'done' || task.status === 'completed';
                  const isReview = task.status === 'in_review';
                  const assignee = task.assigned_to || null;
                  return (
                    <div key={task.id} className={`flex items-center gap-4 px-6 py-4 ${i !== 0 ? 'border-t border-[#f5f3ff]' : ''}`}>
                      {isDone ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                        : isReview ? <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
                          : <Circle size={15} className="text-[#d1d5db] flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#111827] truncate">{task.title}</div>
                        {assignee && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-4 h-4 rounded-full bg-[#ede9fe] flex items-center justify-center text-[8px] font-bold text-[#7c3aed]">{getInitials(assignee)}</div>
                            <span className="text-[11px] text-[#9ca3af]">{assignee}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {task.weight_pct && <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">{task.weight_pct}%</span>}
                        <StatusDot status={task.status} />
                      </div>
                    </div>
                  );
                })}
                {tasks.length > 8 && (
                  <div className="px-6 py-3 border-t border-[#f5f3ff] text-center">
                    <button onClick={() => navigate(`/expert/projects/${id}/tasks`)} className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest">View all {tasks.length} tasks</button>
                  </div>
                )}
              </div>
            )}
          </div>
          {project.description && (
            <div className="bg-white border border-[#ede9fe] rounded-2xl px-6 py-5">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Project Description</p>
              <p className="text-[13px] text-[#6b7280] leading-relaxed">{project.description}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-[#1e1b4b] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center"><Zap size={14} className="text-white" /></div>
              <span className="font-bold text-white text-sm">AI Co-Mentor</span>
            </div>
            <p className="text-[13px] text-[#a5b4fc] mb-4 leading-relaxed">Analyze team performance or generate the next phase's task breakdown.</p>
            <button onClick={() => navigate(`/expert/projects/${id}/tasks`)} className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest mb-2">Generate Tasks</button>
            <button onClick={handleTeamMatching} disabled={aiLoading} className="w-full py-2.5 bg-white/10 text-white text-[11px] font-bold rounded-xl uppercase tracking-widest disabled:opacity-60">
              {aiLoading ? 'Matching…' : 'Team Matching'}
            </button>
          </div>
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
                <button key={label} onClick={() => navigate(path)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-[#374151] text-left">
                  {label}<ChevronRight size={13} className="text-[#d1d5db]" />
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5 space-y-3">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Details</p>
            {[
              { label: 'Client', value: project.client_name || '—' },
              { label: 'Domain', value: domainLabel(project.service_type || '') },
              { label: 'Team', value: `${team.filter(m => m.role === 'student').length || project.team_size || 0} members` },
              { label: 'Budget', value: project.total_price ? `${Number(project.total_price).toLocaleString()} DZD` : '—' },
              { label: 'Started', value: project.started_at ? new Date(project.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
              { label: 'Deadline', value: project.deadline ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
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
  const [allTasks, setAllTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [publishing, setPublishing] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.allSettled([getProjectTasks(id), getProject(id), getProjectTeam(id)])
      .then(([tasksRes, projRes, teamRes]) => {
        if (tasksRes.status === 'fulfilled') setAllTasks(tasksRes.value.data || []);
        if (projRes.status === 'fulfilled') setProject(projRes.value.data || null);
        if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data || []);
      }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  const draftTasks = allTasks.filter(t => t.is_draft);
  const publishedTasks = allTasks.filter(t => !t.is_draft);
  const tasksByCol = COLS.reduce((acc, col) => {
    acc[col] = publishedTasks.filter(t => t.status === col || (col === 'open' && !COLS.includes(t.status)));
    return acc;
  }, {});

  const teamMembers = team.filter(m => m.role === 'student').map(m => ({ id: m.id, name: m.name, domain: m.domain }));

  const moveTask = async (taskId, newStatus) => {
    setUpdating(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (selectedTask?.id === taskId) setSelectedTask(prev => ({ ...prev, status: newStatus }));
      toast.success('Task moved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot update task');
    } finally { setUpdating(null); }
  };

  // ── Expert review: approve (done) or reject (in_progress + note) ──
  const handleReview = async (taskId, newStatus, rejectionNote) => {
    setUpdating(taskId);
    try {
      await updateTask(taskId, {
        status: newStatus,
        ...(rejectionNote ? { rejection_note: rejectionNote } : {}),
      });
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (selectedTask?.id === taskId) setSelectedTask(prev => ({ ...prev, status: newStatus }));
      toast.success(newStatus === 'done' ? 'Task approved ✓' : 'Returned for revision');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task');
    } finally { setUpdating(null); }
  };

  const handleDelete = async (taskId) => {
    setDeletingId(taskId);
    try {
      await deleteTask(taskId);
      setAllTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) setSelectedTask(null);
      toast.success('Draft deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete task');
    } finally { setDeletingId(null); }
  };

  const handlePublishTask = async (taskId) => {
    setPublishing(taskId);
    try {
      await publishTask(taskId);
      toast.success('Task published');
      loadData();
      if (selectedTask?.id === taskId) setSelectedTask(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish task');
    } finally { setPublishing(null); }
  };

  const handleCardClick = (task, e) => {
    if (e.target.closest('button')) return;
    setSelectedTask(task);
  };

  const handleEditFromDrawer = (task) => {
    setSelectedTask(null);
    setEditingTask(task);
    setShowModal(true);
  };

  const total = allTasks.length;
  const done = publishedTasks.filter(t => t.status === 'done').length;

  return (
    <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(`/expert/projects/${id}`)} className="flex items-center gap-1.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest">
          <ArrowLeft size={13} /> {project?.title || 'Project'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">Task Board</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            {total} tasks · {done} done{draftTasks.length > 0 && ` · ${draftTasks.length} drafts`}
          </p>
        </div>
        <button onClick={() => { setEditingTask(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest hover:bg-[#6d28d9] transition-colors">
          <Plus size={13} /> Add Task
        </button>
      </div>

      {!loading && draftTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Drafts — not visible to students</span>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{draftTasks.length}</span>
          </div>
          <WeightBar tasks={allTasks} />
          <div className="mt-3 grid grid-cols-1 gap-2">
            {draftTasks.map(task => {
              const assigneeName = task.assigned_to || null;
              return (
                <div key={task.id} onClick={(e) => handleCardClick(task, e)}
                  className="bg-white border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-semibold text-[#111827] truncate">{task.title}</span>
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">Draft</span>
                    </div>
                    {task.description && <div className="text-[11px] text-[#9ca3af] truncate">{task.description}</div>}
                    <div className="flex items-center gap-3 mt-1">
                      {assigneeName ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-[#ede9fe] flex items-center justify-center text-[8px] font-bold text-[#7c3aed]">{getInitials(assigneeName)}</div>
                          <span className="text-[11px] text-[#9ca3af]">{assigneeName}</span>
                        </div>
                      ) : <span className="text-[11px] text-[#d1d5db]">Unassigned</span>}
                      {task.due_date && <span className="text-[10px] text-[#9ca3af]">Due {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[12px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2.5 py-1 rounded-lg">{task.weight_pct}%</span>
                    <button onClick={() => handlePublishTask(task.id)} disabled={publishing === task.id} title="Publish task"
                      className="p-2 border border-[#ede9fe] rounded-xl text-[#9ca3af] hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors disabled:opacity-40">
                      {publishing === task.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    </button>
                    <button onClick={() => { setEditingTask(task); setShowModal(true); }}
                      className="p-2 border border-[#ede9fe] rounded-xl text-[#9ca3af] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(task.id)} disabled={deletingId === task.id}
                      className="p-2 border border-[#ede9fe] rounded-xl text-[#9ca3af] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40">
                      {deletingId === task.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {publishedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest">Published</span>
            <Lock size={11} className="text-[#9ca3af]" />
          </div>
          {loading ? (
            <div className="flex gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="flex-1 h-80" />)}</div>
          ) : (
            <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
              {COLS.map(col => (
                <div key={col} className="flex-1 min-w-[220px] flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${COL_DOT[col]}`} />
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${COL_TEXT[col]}`}>{COL_LABELS[col]}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#9ca3af]">{tasksByCol[col]?.length || 0}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {tasksByCol[col]?.map(task => {
                      const assigneeName = task.assigned_to || null;
                      const isSelected = selectedTask?.id === task.id;
                      return (
                        <div key={task.id} onClick={(e) => handleCardClick(task, e)}
                          className={`bg-white border rounded-2xl px-4 py-4 cursor-pointer transition-all ${isSelected ? 'border-[#7c3aed] ring-2 ring-[#7c3aed]/10' : 'border-[#ede9fe] hover:border-[#c4b5fd] hover:shadow-sm'}`}>
                          <div className="text-[13px] font-semibold text-[#111827] mb-1.5 leading-snug">{task.title}</div>
                          {task.description && <div className="text-[11px] text-[#9ca3af] mb-3 line-clamp-2 leading-relaxed">{task.description}</div>}
                          {assigneeName ? (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-5 h-5 rounded-full bg-[#ede9fe] flex items-center justify-center text-[8px] font-bold text-[#7c3aed] flex-shrink-0">{getInitials(assigneeName)}</div>
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
                              {task.weight_pct && <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-1.5 py-0.5 rounded-full">{task.weight_pct}%</span>}
                              {task.due_date && <span className="text-[10px] text-[#9ca3af]">{new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                            </div>
                            {col !== 'done' && col !== 'in_review' && (
                              <button onClick={(e) => { e.stopPropagation(); moveTask(task.id, COLS[COLS.indexOf(col) + 1]); }}
                                disabled={updating === task.id}
                                className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2.5 py-1 rounded-lg disabled:opacity-50 hover:bg-[#ede9fe] transition-colors">
                                {updating === task.id ? '…' : '→'}
                              </button>
                            )}
                            {col === 'in_review' && (
                              <button onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                                className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">
                                Review
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
        </div>
      )}

      {!loading && allTasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ClipboardList size={28} className="text-[#d1d5db] mx-auto mb-3" />
            <p className="text-sm text-[#9ca3af] mb-1">No tasks yet</p>
            <p className="text-xs text-[#d1d5db]">Add your first task or use AI to generate a breakdown</p>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          teamMembers={teamMembers}
          onClose={() => setSelectedTask(null)}
          onEdit={handleEditFromDrawer}
          onMove={moveTask}
          onReview={handleReview}
          moving={updating}
        />
      )}

      {showModal && (
        <TaskModal
          projectId={id}
          projectDomain={project?.service_type}
          teamMembers={teamMembers}
          editTask={editingTask}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          onSaved={loadData}
        />
      )}
    </div>
  );
}