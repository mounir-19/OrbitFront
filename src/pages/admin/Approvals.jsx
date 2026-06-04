import { useState, useEffect } from 'react';
import {
  Star, User, CreditCard, FolderOpen, GitBranch,
  ChevronDown, ChevronUp, CheckCircle, X, RefreshCw, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getUsers, getAllProjects, getPayouts, getReferrals,
  updateUserStatus, updatePayment, assignExpert, updateReferral,
  assignStudentToExpert,
} from '../../api/admin.api';
import toast from 'react-hot-toast';

const TABS = ['Projects', 'Referrals', 'Experts', 'Students'];

const DOMAIN_LABELS = {
  web_dev: 'Web Development',
  mobile_dev: 'Mobile Development',
  ui_ux_design: 'UI/UX Design',
  video_editing: 'Video Editing',
  other: 'Other',
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

const getInitials = (str = '') =>
  str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

// ─── Assign Expert Modal ──────────────────────────────────────────────────────
// ─── REPLACE AssignExpertModal in Approvals.jsx with this ───────────────────
// Change: admin sets budget + deadline before assigning expert
// This ensures client sees the scoped budget when they get notified

// ─── REPLACE AssignExpertModal in Approvals.jsx with this ───────────────────
// Simplified: admin just picks expert, no budget/deadline
// Expert will fill those when publishing to students

function AssignExpertModal({ project, onClose, onAssigned }) {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUsers({ role: 'expert', status: 'active', domain: project.service_type })
      .then(res => {
        const list = res.data?.users || [];
        if (list.length > 0) { setExperts(list); return; }
        return getUsers({ role: 'expert', status: 'active' })
          .then(r => setExperts(r.data?.users || []));
      })
      .catch(() => toast.error('Could not load experts'))
      .finally(() => setLoading(false));
  }, [project.service_type]);

  const handleAssign = async () => {
    if (!selected) { toast.error('Select an expert first.'); return; }
    setSaving(true);
    try {
      const pid = project.project_id || project.id;
      await assignExpert(pid, selected);
      toast.success('Expert assigned — they will scope and publish the project');
      onAssigned(pid);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign expert');
    } finally { setSaving(false); }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ede9fe] w-full max-w-md overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f3ff]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
              <FolderOpen size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#111827]">Assign Expert</h2>
              <p className="text-[11px] text-[#9ca3af] truncate max-w-xs">{project.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#f5f3ff]">
            <X size={16} className="text-[#9ca3af]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-xl px-4 py-3">
            <div className="text-[12px] font-bold text-[#7c3aed] mb-1">
              {DOMAIN_LABELS[project.service_type] || project.service_type}
            </div>
            {project.description && (
              <p className="text-[11px] text-[#6b7280] line-clamp-2">{project.description}</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-widest mb-2">
              Select Expert *
            </label>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : experts.length === 0 ? (
              <p className="text-[13px] text-[#9ca3af] py-4">No active experts found for this domain.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {experts.map(e => {
                  const isSelected = selected === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelected(e.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all
                        ${isSelected
                          ? 'border-[#7c3aed] bg-[#f5f3ff]'
                          : 'border-[#ede9fe] hover:border-[#c4b5fd] hover:bg-[#faf5ff]'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#ede9fe] flex items-center justify-center text-[11px] font-bold text-[#7c3aed] flex-shrink-0">
                            {getInitials(`${e.first_name} ${e.last_name}`)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#111827]">{e.first_name} {e.last_name}</div>
                            <div className="text-[11px] text-[#9ca3af]">{DOMAIN_LABELS[e.domain] || e.domain || '—'}</div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle size={15} className="text-[#7c3aed] flex-shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-xl px-4 py-3 text-[11px] text-[#7c3aed]">
            The expert will review the scope, set the budget and deadline, then publish to students. Admin approves before the client is notified.
          </div>

          <button
            onClick={handleAssign}
            disabled={!selected || saving}
            className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            {saving && <RefreshCw size={12} className="animate-spin" />}
            {saving ? 'Assigning…' : 'Assign to Expert'}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Assign Student to Expert Modal ──────────────────────────────────────────
function AssignStudentExpertModal({ student, onClose, onAssigned }) {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(student.assigned_expert_id || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUsers({ role: 'expert', status: 'active', domain: student.domain })
      .then(res => {
        const list = res.data?.users || [];
        if (list.length > 0) { setExperts(list); return; }
        return getUsers({ role: 'expert', status: 'active' })
          .then(r => setExperts(r.data?.users || []));
      })
      .catch(() => toast.error('Could not load experts'))
      .finally(() => setLoading(false));
  }, [student.domain]);

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await assignStudentToExpert(student.id, selected);
      toast.success('Student assigned to expert for vetting');
      onAssigned(student.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign expert');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ede9fe] w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f3ff]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#111827]">Assign to Expert</h2>
              <p className="text-[11px] text-[#9ca3af] truncate max-w-xs">
                {student.first_name} {student.last_name}{student.university ? ` · ${student.university}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#f5f3ff]">
            <X size={16} className="text-[#9ca3af]" />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="px-3 py-2 bg-[#f5f3ff] border border-[#ede9fe] rounded-xl text-[12px] text-[#7c3aed] font-semibold mb-4">
            Domain: {DOMAIN_LABELS[student.domain] || student.domain || '—'}
          </div>
          {student.assigned_expert_id && (
            <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-[12px] text-amber-700 mb-4">
              Already assigned — selecting a new expert will reassign this student.
            </div>
          )}
          {loading ? (
            <div className="space-y-2 mb-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : experts.length === 0 ? (
            <p className="text-[13px] text-[#9ca3af] py-4">No active experts found.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-4">
              {experts.map(e => {
                const isSelected = selected === e.id;
                return (
                  <button key={e.id} type="button" onClick={() => setSelected(e.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all
                      ${isSelected ? 'border-[#7c3aed] bg-[#f5f3ff]' : 'border-[#ede9fe] hover:border-[#c4b5fd] hover:bg-[#faf5ff]'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#ede9fe] flex items-center justify-center text-[11px] font-bold text-[#7c3aed] flex-shrink-0">
                          {getInitials(`${e.first_name} ${e.last_name}`)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#111827]">{e.first_name} {e.last_name}</div>
                          <div className="text-[11px] text-[#9ca3af]">{DOMAIN_LABELS[e.domain] || e.domain || '—'}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle size={15} className="text-[#7c3aed] flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <button onClick={handleAssign} disabled={!selected || saving}
            className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
            {saving && <RefreshCw size={12} className="animate-spin" />}
            {saving ? 'Assigning…' : 'Assign to Expert'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Row ──────────────────────────────────────────────────────────────
function ProjectRow({ project, onAssigned }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pid = project.project_id || project.id;

  return (
    <>
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div
            onClick={() => navigate(`/admin/projects/${pid}`)}
            className="w-10 h-10 rounded-full bg-[#ede9fe] flex items-center justify-center text-[11px] font-bold text-[#7c3aed] flex-shrink-0 cursor-pointer hover:bg-[#ddd6fe] transition-colors"
          >
            {getInitials(project.title)}
          </div>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => navigate(`/admin/projects/${pid}`)}
          >
            <div className="text-[13px] font-semibold text-[#111827] hover:text-[#7c3aed] transition-colors">
              {project.title}
            </div>
            <div className="text-[11px] text-[#9ca3af] mt-0.5">
              {project.client_name || '—'} · {DOMAIN_LABELS[project.service_type] || project.service_type}
              {project.total_price ? ` · ${Number(project.total_price).toLocaleString()} DZD` : ''}
            </div>
          </div>
          <span className="text-[11px] text-[#9ca3af] flex-shrink-0">
            {project.created_at ? new Date(project.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
          </span>
          <button onClick={() => setExpanded(v => !v)}
            className="px-3 py-1.5 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest flex items-center gap-1 hover:bg-[#f5f3ff] transition-colors">
            Details {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <button onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors">
            Assign Expert
          </button>
        </div>
        {expanded && (
          <div className="mt-3 ml-[56px] pl-4 border-l-2 border-[#ede9fe] text-[12px] text-[#6b7280] space-y-1">
            {project.description && <p className="leading-relaxed">{project.description}</p>}
            <div className="flex items-center gap-4 pt-1 text-[11px] text-[#9ca3af]">
              {project.team_size && <span>Team: {project.team_size}</span>}
              {project.deadline && <span>Deadline: {new Date(project.deadline).toLocaleDateString('en-GB')}</span>}
              {project.skills_needed && <span>Skills: {project.skills_needed}</span>}
            </div>
            <button
              onClick={() => navigate(`/admin/projects/${pid}`)}
              className="mt-2 text-[11px] font-bold text-[#7c3aed] hover:underline"
            >
              View Full Detail →
            </button>
          </div>
        )}
      </div>
      {showModal && (
        <AssignExpertModal project={project} onClose={() => setShowModal(false)} onAssigned={onAssigned} />
      )}
    </>
  );
}
// ─── Referral Row ─────────────────────────────────────────────────────────────
function ReferralRow({ referral, onAction }) {
  const [acting, setActing] = useState(null);

  const handleAction = async (status) => {
    setActing(status);
    try {
      await updateReferral(referral.id, { status });
      toast.success(status === 'converted' ? 'Referral converted ✓' : 'Referral rejected');
      onAction(referral.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update referral');
    } finally { setActing(null); }
  };

  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="w-10 h-10 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
        <GitBranch size={14} className="text-[#7c3aed]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[#111827]">{referral.client_contact}</div>
        <div className="text-[11px] text-[#9ca3af] mt-0.5">
          Referred by {referral.student_name || '—'}
          {referral.bonus_amount ? ` · Bonus: ${Number(referral.bonus_amount).toLocaleString()} DZD` : ''}
        </div>
      </div>
      <span className="text-[11px] text-[#9ca3af] flex-shrink-0">
        {referral.referred_at ? new Date(referral.referred_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
      </span>
      <button onClick={() => handleAction('rejected')} disabled={!!acting}
        className="px-3 py-1.5 border border-red-200 text-red-500 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50 transition-colors">
        {acting === 'rejected' ? '…' : 'Reject'}
      </button>
      <button onClick={() => handleAction('converted')} disabled={!!acting}
        className="px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 transition-colors">
        {acting === 'converted' ? '…' : 'Convert'}
      </button>
    </div>
  );
}

// ─── Expert/User Row ──────────────────────────────────────────────────────────
function UserRow({ user, onApprove, onReject }) {
  const [acting, setActing] = useState(null);

  const handleApprove = async () => {
    setActing('approve');
    try {
      await updateUserStatus(user.id, 'active');
      toast.success(`${user.first_name} approved`);
      onApprove(user.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally { setActing(null); }
  };

  const handleReject = async () => {
    setActing('reject');
    try {
      await updateUserStatus(user.id, 'suspended');
      toast.success('User rejected');
      onReject(user.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    } finally { setActing(null); }
  };

  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="w-10 h-10 rounded-full bg-[#ede9fe] flex items-center justify-center text-[11px] font-bold text-[#7c3aed] flex-shrink-0">
        {getInitials(`${user.first_name} ${user.last_name}`)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[#111827]">{user.first_name} {user.last_name}</div>
        <div className="text-[11px] text-[#9ca3af] mt-0.5">
          {user.email} · {DOMAIN_LABELS[user.domain] || user.domain || user.role}
        </div>
      </div>
      <span className="text-[11px] text-[#9ca3af] flex-shrink-0">
        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
      </span>
      <button onClick={handleReject} disabled={!!acting}
        className="px-3 py-1.5 border border-red-200 text-red-500 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50 transition-colors">
        {acting === 'reject' ? '…' : 'Reject'}
      </button>
      <button onClick={handleApprove} disabled={!!acting}
        className="px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 transition-colors">
        {acting === 'approve' ? '…' : 'Approve'}
      </button>
    </div>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────
function StudentRow({ student, onAssigned }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="w-10 h-10 rounded-full bg-[#ede9fe] flex items-center justify-center text-[11px] font-bold text-[#7c3aed] flex-shrink-0">
          {getInitials(`${student.first_name} ${student.last_name}`)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[#111827]">{student.first_name} {student.last_name}</div>
          <div className="text-[11px] text-[#9ca3af] mt-0.5">
            {student.email} · {DOMAIN_LABELS[student.domain] || student.domain || '—'}
            {student.university ? ` · ${student.university}` : ''}
          </div>
        </div>
        <div className="flex-shrink-0">
          {student.assigned_expert_id ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
              <CheckCircle size={9} /> Assigned
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[#9ca3af] bg-[#f5f3ff] border border-[#ede9fe] px-2 py-0.5 rounded-full uppercase tracking-wide">
              Unassigned
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#9ca3af] flex-shrink-0">
          {student.created_at ? new Date(student.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
        </span>
        <button onClick={() => setShowModal(true)}
          className="px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors flex-shrink-0">
          {student.assigned_expert_id ? 'Reassign' : 'Assign to Expert'}
        </button>
      </div>
      {showModal && (
        <AssignStudentExpertModal student={student} onClose={() => setShowModal(false)} onAssigned={onAssigned} />
      )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Approvals() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [experts, setExperts] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getAllProjects({ status: 'submitted' }),
      getReferrals(),
      getUsers({ role: 'expert', status: 'pending' }),
      getUsers({ role: 'student', status: 'pending' }),
    ]).then(([projRes, refRes, expRes, stuRes]) => {
      setProjects(projRes.status === 'fulfilled' ? projRes.value.data || [] : []);
      setReferrals(refRes.status === 'fulfilled'
        ? (refRes.value.data || []).filter(r => r.status === 'pending') : []);
      setExperts(expRes.status === 'fulfilled' ? expRes.value.data?.users || [] : []);
      setStudents(stuRes.status === 'fulfilled' ? stuRes.value.data?.users || [] : []);
    }).finally(() => setLoading(false));
  }, []);

  const counts = [projects.length, referrals.length, experts.length, students.length];
  const total = counts.reduce((a, b) => a + b, 0);

  const removeProject = (id) => setProjects(prev => prev.filter(p => (p.project_id || p.id) !== id));
  const removeReferral = (id) => setReferrals(prev => prev.filter(r => r.id !== id));
  const removeExpert = (id) => setExperts(prev => prev.filter(u => u.id !== id));
  const markStudentAssigned = (id) =>
    setStudents(prev => prev.map(s => s.id === id ? { ...s, assigned_expert_id: '__assigned__' } : s));

  const isEmpty = (i) => [projects, referrals, experts, students][i].length === 0;

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Approvals</h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            {loading ? 'Loading…' : `${total} item${total !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>

        {/* summary badges */}
        {!loading && (
          <div className="flex items-center gap-2">
            {TABS.map((t, i) => counts[i] > 0 && (
              <button key={t} onClick={() => setTab(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all
                  ${tab === i ? 'bg-[#7c3aed] text-white' : 'bg-white border border-[#ede9fe] text-[#6b7280]'}`}>
                {t}
                <span className={`text-[10px] font-bold px-1 rounded-full ${tab === i ? 'bg-white/20 text-white' : 'bg-[#f5f3ff] text-[#7c3aed]'}`}>
                  {counts[i]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 border-b border-[#f5f3ff] mb-5">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`relative flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors
              ${tab === i ? 'text-[#7c3aed]' : 'text-[#9ca3af] hover:text-[#6b7280]'}`}>
            {t}
            {counts[i] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                ${tab === i ? 'bg-[#7c3aed] text-white' : 'bg-[#f5f3ff] text-[#7c3aed]'}`}>
                {counts[i]}
              </span>
            )}
            {tab === i && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#7c3aed] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-5 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : isEmpty(tab) ? (
          <div className="py-16 text-center">
            <CheckCircle size={22} className="text-[#ede9fe] mx-auto mb-2" />
            <p className="text-sm text-[#9ca3af]">No {TABS[tab].toLowerCase()} pending review.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f5f3ff]">
            {tab === 0 && projects.map(p => (
              <ProjectRow key={p.project_id || p.id} project={p} onAssigned={removeProject} />
            ))}
            {tab === 1 && referrals.map(r => (
              <ReferralRow key={r.id} referral={r} onAction={removeReferral} />
            ))}
            {tab === 2 && experts.map(u => (
              <UserRow key={u.id} user={u} onApprove={removeExpert} onReject={removeExpert} />
            ))}
            {tab === 3 && students.map(u => (
              <StudentRow key={u.id} student={u} onAssigned={markStudentAssigned} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}