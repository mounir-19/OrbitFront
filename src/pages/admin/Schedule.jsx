import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Video, Plus,
  X, RefreshCw, AlertCircle, Clock,
  CalendarDays, Link2, FolderOpen, CheckCircle, Users, Zap,
} from 'lucide-react';
import { getInterviews, updateInterview, deleteInterview, getUsers, getAllProjects } from '../../api/admin.api';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, cur: false });
  return cells;
}

function getTimeInfo(scheduled_at) {
  const now = new Date();
  const date = new Date(scheduled_at);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const endStr = new Date(date.getTime() + 60 * 60 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  if (date >= todayStart && date <= todayEnd) return { label: `Today, ${timeStr} – ${endStr}`, status: 'today' };
  if (date >= tomorrowStart && date <= tomorrowEnd) return { label: `Tomorrow, ${timeStr} – ${endStr}`, status: 'tomorrow' };
  return { label: `${dateStr}, ${timeStr} – ${endStr}`, status: 'upcoming' };
}

function toDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ markedDays, admittedDays, selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const cells = getCalendarDays(viewYear, viewMonth);

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  return (
    <div className="bg-white border border-[#ede9fe] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[17px] font-bold text-[#111827]">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-[#f5f3ff] rounded-xl transition-colors">
            <ChevronLeft size={16} className="text-[#7c3aed]" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-[#f5f3ff] rounded-xl transition-colors">
            <ChevronRight size={16} className="text-[#7c3aed]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-[#9ca3af] py-2 uppercase tracking-widest">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const isToday = cell.cur && cell.day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          const cellDate = new Date(viewYear, viewMonth, cell.day);
          const isSelected = cell.cur && selectedDate && cellDate.toDateString() === selectedDate.toDateString();
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
          const hasPending = cell.cur && markedDays.has(key);
          const hasAdmitted = cell.cur && admittedDays.has(key);
          return (
            <button key={i} onClick={() => cell.cur && onSelectDate(cellDate)}
              className={`aspect-square p-1 rounded-xl text-sm relative flex flex-col items-center justify-center transition-colors
                ${!cell.cur ? 'text-[#d1d5db] cursor-default' : ''}
                ${isToday ? 'bg-[#7c3aed] font-bold text-white' : ''}
                ${isSelected && !isToday ? 'bg-[#f5f3ff] font-semibold text-[#7c3aed]' : ''}
                ${cell.cur && !isToday && !isSelected ? 'text-[#111827] hover:bg-[#f5f3ff]' : ''}`}>
              <span>{cell.day}</span>
              {(hasPending || hasAdmitted) && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {hasPending && <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-white/70' : 'bg-[#7c3aed]'}`} />}
                  {hasAdmitted && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-[#f5f3ff] flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
          <span className="text-[10px] text-[#9ca3af]">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-[#9ca3af]">Admitted</span>
        </div>
      </div>
    </div>
  );
}

// ─── Interview Card ───────────────────────────────────────────────────────────
function InterviewCard({ interview, onCopy, onResult, onDelete }) {
  const { label, status } = getTimeInfo(interview.scheduled_at);
  const [acting, setActing] = useState(false);

  const timeColor = {
    today: 'text-emerald-600',
    tomorrow: 'text-amber-500',
    upcoming: 'text-[#9ca3af]',
  }[status];

  const borderColor = interview.status === 'cancelled' ? 'border-[#d1d5db]'
    : interview.result === 'admitted' ? 'border-emerald-400'
      : status === 'today' ? 'border-emerald-400'
        : status === 'tomorrow' ? 'border-amber-400'
          : 'border-[#7c3aed]';

  const handleResult = async (result) => {
    setActing(true);
    try {
      await updateInterview(interview.id, { result });
      onResult(interview.id, result);
      toast.success(result === 'admitted' ? 'Student admitted ✓' : 'Interview rejected');
    } catch { toast.error('Failed to update'); }
    setActing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this interview?')) return;
    setActing(true);
    try {
      await deleteInterview(interview.id);
      onDelete(interview.id);
      toast.success('Interview deleted');
    } catch { toast.error('Failed to delete'); }
    setActing(false);
  };

  return (
    <div className={`border-l-2 pl-4 py-3 group ${borderColor} ${interview.status === 'cancelled' ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[13px] font-semibold text-[#111827]">{interview.student_name || '—'}</span>
            {interview.status === 'cancelled' && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Cancelled</span>
            )}
            {interview.result === 'admitted' && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Admitted</span>
            )}
            {interview.result === 'rejected' && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Rejected</span>
            )}
          </div>
          <span className={`text-[11px] font-medium ${timeColor} block mb-1`}>{label}</span>
          {interview.project_title && (
            <div className="flex items-center gap-1.5 mb-1">
              <FolderOpen size={10} className="text-[#9ca3af]" />
              <span className="text-[11px] text-[#9ca3af]">{interview.project_title}</span>
            </div>
          )}
          {interview.expert_name && (
            <div className="flex items-center gap-1.5 mb-3">
              <Users size={10} className="text-[#9ca3af]" />
              <span className="text-[11px] text-[#9ca3af]">Expert: {interview.expert_name}</span>
            </div>
          )}
          <div className="flex items-center flex-wrap gap-2">
            {interview.meeting_link ? (
              <>
                <button
                  onClick={() => window.open(interview.meeting_link, '_blank')}
                  disabled={interview.status === 'cancelled'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-lg hover:bg-[#6d28d9] disabled:opacity-40 transition-colors uppercase tracking-wide"
                >
                  <Video size={11} /> Join
                </button>
                <button
                  onClick={() => onCopy(interview.meeting_link)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#ede9fe] text-[#6b7280] text-[11px] rounded-lg hover:bg-[#f5f3ff] transition-colors"
                >
                  <Link2 size={11} /> Copy Link
                </button>
              </>
            ) : (
              <span className="text-[11px] text-[#d1d5db] italic">No meeting link</span>
            )}
            {interview.status !== 'cancelled' && !interview.result && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => handleResult('admitted')} disabled={acting}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-emerald-200 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors uppercase tracking-wide">
                  <CheckCircle size={10} /> Admit
                </button>
                <button onClick={() => handleResult('rejected')} disabled={acting}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-500 text-[10px] font-bold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors uppercase tracking-wide">
                  <X size={10} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
        <button onClick={handleDelete} disabled={acting}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg flex-shrink-0">
          <X size={13} className="text-[#9ca3af] hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Plan Meeting Modal ───────────────────────────────────────────────────────
function PlanMeetingModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [experts, setExperts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingExperts, setLoadingExperts] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ expert_id: '', project_id: '', student_id: '', date: '', time: '', meeting_link: '' });

  useEffect(() => {
    getUsers({ role: 'expert', status: 'active' })
      .then(res => setExperts(res.data?.users || []))
      .catch(() => toast.error('Could not load experts'))
      .finally(() => setLoadingExperts(false));
  }, []);

  useEffect(() => {
    if (!form.expert_id) { setProjects([]); return; }
    setLoadingProjects(true);
    getAllProjects({ expert_id: form.expert_id })
      .then(res => setProjects(res.data || []))
      .catch(() => { })
      .finally(() => setLoadingProjects(false));
  }, [form.expert_id]);

  useEffect(() => {
    if (!form.project_id) { setStudents([]); return; }
    setLoadingStudents(true);
    getUsers({ role: 'student', status: 'active' })
      .then(res => setStudents(res.data?.users || []))
      .catch(() => { })
      .finally(() => setLoadingStudents(false));
  }, [form.project_id]);

  const handleSubmit = async () => {
    if (!form.expert_id || !form.date || !form.time) return;
    if (!form.project_id && !form.student_id) { toast.error('Select a project or student'); return; }
    const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString();
    setSubmitting(true);
    try {
      const payload = {
        expert_id: form.expert_id,
        scheduled_at,
        ...(form.project_id ? { project_id: form.project_id } : {}),
        ...(form.student_id ? { student_id: form.student_id } : {}),
        ...(form.meeting_link ? { meeting_link: form.meeting_link } : {}),
      };
      const res = await api.post('/interviews', payload);
      toast.success(Array.isArray(res.data) ? `${res.data.length} interviews scheduled` : 'Interview scheduled');
      onCreated(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedExpert = experts.find(e => e.id === form.expert_id);
  const stepTitles = ['Select Expert', 'Project & Student', 'Date & Time'];

  const INPUT_CLS = 'w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] bg-white transition-all';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ede9fe] w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f3ff]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#111827]">Plan Interview</h2>
              <p className="text-[11px] text-[#9ca3af]">Step {step} — {stepTitles[step - 1]}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#f5f3ff] transition-colors">
            <X size={16} className="text-[#9ca3af]" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex px-6 pt-4 gap-2">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= n ? 'bg-[#7c3aed]' : 'bg-[#ede9fe]'}`} />
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Step 1 */}
          {step === 1 && (
            <>
              <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Choose Expert</label>
              {loadingExperts ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : experts.length === 0 ? (
                <p className="text-[12px] text-[#9ca3af]">No active experts found.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {experts.map(e => {
                    const isSelected = form.expert_id === e.id;
                    return (
                      <button key={e.id} type="button"
                        onClick={() => setForm(f => ({ ...f, expert_id: e.id, project_id: '', student_id: '' }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all
                          ${isSelected ? 'border-[#7c3aed] bg-[#f5f3ff]' : 'border-[#ede9fe] hover:border-[#c4b5fd] hover:bg-[#faf5ff]'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#111827]">{e.first_name} {e.last_name}</div>
                            <div className="text-[11px] text-[#9ca3af] mt-0.5">{e.domain?.replace(/_/g, ' ') || e.email}</div>
                          </div>
                          {isSelected && <CheckCircle size={15} className="text-[#7c3aed] flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <button type="button" disabled={!form.expert_id} onClick={() => setStep(2)}
                className="w-full py-3 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl hover:bg-[#6d28d9] disabled:opacity-40 transition-colors uppercase tracking-widest">
                Next →
              </button>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <button type="button" onClick={() => setStep(1)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest -mt-1 mb-1">
                <ChevronLeft size={12} /> Back
              </button>
              <div className="px-3 py-2 bg-[#f5f3ff] border border-[#ede9fe] rounded-xl text-[12px] text-[#7c3aed] font-semibold">
                Expert: {selectedExpert?.first_name} {selectedExpert?.last_name}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">
                  Project <span className="font-normal normal-case text-[#d1d5db]">(optional)</span>
                </label>
                {loadingProjects ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select value={form.project_id}
                    onChange={e => setForm(f => ({ ...f, project_id: e.target.value, student_id: '' }))}
                    className={INPUT_CLS}>
                    <option value="">No specific project</option>
                    {projects.map(p => <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.title}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Student</label>
                {loadingStudents ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select value={form.student_id}
                    onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                    className={INPUT_CLS}>
                    <option value="">{form.project_id ? 'All students in project' : 'Select a student'}</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                )}
                {form.project_id && !form.student_id && (
                  <p className="text-[11px] text-[#9ca3af] mt-1">Leaving blank schedules for all active students in the project.</p>
                )}
              </div>
              <button type="button" disabled={!form.student_id && !form.project_id} onClick={() => setStep(3)}
                className="w-full py-3 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl hover:bg-[#6d28d9] disabled:opacity-40 transition-colors uppercase tracking-widest">
                Next →
              </button>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <button type="button" onClick={() => setStep(2)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest -mt-1 mb-1">
                <ChevronLeft size={12} /> Back
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Date</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className={INPUT_CLS} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Time</label>
                  <input type="time" value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className={INPUT_CLS} required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">
                  Meeting Link <span className="font-normal normal-case text-[#d1d5db]">(optional)</span>
                </label>
                <input type="url" value={form.meeting_link}
                  onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))}
                  placeholder="https://meet.jit.si/..."
                  className={INPUT_CLS} />
              </div>
              <button type="button" onClick={handleSubmit}
                disabled={submitting || !form.date || !form.time}
                className="w-full py-3 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl hover:bg-[#6d28d9] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                {submitting && <RefreshCw size={12} className="animate-spin" />}
                {submitting ? 'Scheduling…' : form.student_id ? 'Schedule Interview' : 'Schedule for All Students'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Schedule() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  const fetchInterviews = () => {
    setLoading(true);
    setError(null);
    getInterviews()
      .then(res => setInterviews(res.data || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load interviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInterviews(); }, []);

  const today = new Date();

  const markedDays = new Set(
    interviews.filter(i => i.status !== 'cancelled' && i.result !== 'admitted').map(i => toDateKey(i.scheduled_at))
  );
  const admittedDays = new Set(
    interviews.filter(i => i.result === 'admitted').map(i => toDateKey(i.scheduled_at))
  );

  const todayInterviews = interviews.filter(i => new Date(i.scheduled_at).toDateString() === today.toDateString());
  const upcomingInterviews = interviews
    .filter(i => i.status !== 'cancelled' && new Date(i.scheduled_at) > today)
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 5);
  const selectedDateInterviews = interviews
    .filter(i => new Date(i.scheduled_at).toDateString() === selectedDate.toDateString())
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const handleCopy = (link) => { navigator.clipboard.writeText(link); toast.success('Link copied'); };
  const handleResult = (id, result) => setInterviews(prev => prev.map(i => i.id === id ? { ...i, result } : i));
  const handleDelete = (id) => setInterviews(prev => prev.filter(i => i.id !== id));
  const handleCreated = (data) => {
    const items = Array.isArray(data) ? data : [data];
    setInterviews(prev => [...items, ...prev]);
    if (items[0]?.scheduled_at) setSelectedDate(new Date(items[0].scheduled_at));
  };

  const statCards = [
    { label: 'Total', value: interviews.length },
    { label: 'Upcoming', value: upcomingInterviews.length },
    { label: 'Admitted', value: interviews.filter(i => i.result === 'admitted').length },
    { label: 'Today', value: todayInterviews.length },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Schedule</h1>
          <p className="text-sm text-[#6b7280] mt-1.5">All interviews scheduled across the platform.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInterviews}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#ede9fe] bg-white rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest hover:bg-[#f5f3ff] transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#6d28d9] transition-colors">
            <Plus size={14} /> Plan Interview
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white border border-[#ede9fe] rounded-2xl px-6 py-5">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">{s.label}</div>
            {loading
              ? <div className="animate-pulse h-7 w-10 bg-[#f0eeff] rounded-xl" />
              : <div className="text-2xl font-bold text-[#111827]">{s.value}</div>
            }
          </div>
        ))}
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Left — calendar + selected day */}
        <div className="col-span-2 space-y-4">
          <MiniCalendar
            markedDays={markedDays}
            admittedDays={admittedDays}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <div className="bg-white border border-[#ede9fe] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#111827] text-base">
                {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {selectedDateInterviews.length > 0 && (
                <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                  {selectedDateInterviews.length} interview{selectedDateInterviews.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(n => <Skeleton key={n} className="h-16 w-full" />)}
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-600">
                <AlertCircle size={14} className="flex-shrink-0" /> {error}
                <button onClick={fetchInterviews} className="ml-auto text-[11px] underline flex items-center gap-1">
                  <RefreshCw size={11} /> Retry
                </button>
              </div>
            ) : selectedDateInterviews.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays size={22} className="text-[#ede9fe] mx-auto mb-2" />
                <p className="text-sm text-[#9ca3af]">No interviews on this day.</p>
                <button onClick={() => setShowModal(true)}
                  className="mt-2 text-[12px] font-bold text-[#7c3aed] uppercase tracking-widest hover:underline">
                  Schedule one →
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {selectedDateInterviews.map(i => (
                  <InterviewCard key={i.id} interview={i} onCopy={handleCopy} onResult={handleResult} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {todayInterviews.length > 0 && (
            <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-[#7c3aed]" />
                <h3 className="font-bold text-[#111827] text-sm">Today</h3>
                <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                  {todayInterviews.length}
                </span>
              </div>
              <div className="space-y-5">
                {todayInterviews.map(i => (
                  <InterviewCard key={i.id} interview={i} onCopy={handleCopy} onResult={handleResult} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={14} className="text-[#7c3aed]" />
              <h3 className="font-bold text-[#111827] text-sm">Upcoming</h3>
            </div>
            {upcomingInterviews.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={20} className="text-[#ede9fe] mx-auto mb-2" />
                <p className="text-sm text-[#9ca3af]">No upcoming interviews</p>
              </div>
            ) : (
              <div className="space-y-5">
                {upcomingInterviews.map(i => (
                  <InterviewCard key={i.id} interview={i} onCopy={handleCopy} onResult={handleResult} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          {/* Dark overview card */}
          <div className="bg-[#1e1b4b] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-white text-sm">Overview</span>
            </div>
            <p className="text-[13px] text-[#a5b4fc] mb-4 leading-relaxed">Platform-wide interview snapshot.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Total', value: interviews.length, color: 'text-white' },
                { label: 'Today', value: todayInterviews.length, color: 'text-white' },
                { label: 'Admitted', value: interviews.filter(i => i.result === 'admitted').length, color: 'text-emerald-400' },
                { label: 'Rejected', value: interviews.filter(i => i.result === 'rejected').length, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2.5 text-center">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-[#a5b4fc] mt-0.5 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && <PlanMeetingModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}