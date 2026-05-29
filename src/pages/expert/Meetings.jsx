import { useState, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Video, Copy, MoreVertical,
    Users, X, RefreshCw, AlertCircle, Clock, CheckCircle,
    CalendarDays, Link2, FolderOpen,
} from 'lucide-react';
import {
    getInterviews, scheduleInterview, updateInterview,
    getStudentsList, getProjects,
} from '../../api/expert.api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/** Unwrap whatever shape the API returns into a plain array */
function toArray(res) {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.projects)) return d.projects;
    if (Array.isArray(d?.rows)) return d.rows;
    return [];
}

/** Normalise project row — view might use project_id or id */
function normaliseProject(p) {
    const id = String(p.id ?? p.project_id ?? '').trim();
    return { ...p, id };
}

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
    const endStr = new Date(date.getTime() + 60 * 60 * 1000)
        .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    if (date >= todayStart && date <= todayEnd) return { label: `Today, ${timeStr} – ${endStr}`, status: 'today' };
    if (date >= tomorrowStart && date <= tomorrowEnd) return { label: `Tomorrow, ${timeStr} – ${endStr}`, status: 'tomorrow' };
    return { label: `${dateStr}, ${timeStr} – ${endStr}`, status: 'upcoming' };
}

function isLiveSoon(scheduled_at) {
    const diff = new Date(scheduled_at) - new Date();
    return diff >= 0 && diff <= 10 * 60 * 1000;
}

function toDateKey(date) {
    return new Date(date).toISOString().slice(0, 10);
}

// ─── Live Banner ──────────────────────────────────────────────────────────────
function LiveBanner({ interview, onDismiss }) {
    return (
        <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-sm font-medium text-purple-900">
                        Live Sync — <strong>{interview.student_name}</strong> starting in 5 minutes
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.open(interview.meeting_link, '_blank')}
                        className="px-4 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                        Join Meeting
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(interview.meeting_link); toast.success('Link copied'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-300 text-purple-700 text-xs rounded-lg hover:bg-purple-100 transition-colors">
                        <Copy size={12} /> Copy Link
                    </button>
                    <button onClick={onDismiss} className="ml-1 text-purple-400 hover:text-purple-700 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function MiniCalendar({ markedDays, admittedDays, selectedDate, onSelectDate }) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const cells = getCalendarDays(viewYear, viewMonth);

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft size={18} className="text-gray-600" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronRight size={18} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_OF_WEEK.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                    const isToday = cell.cur && cell.day === today.getDate()
                        && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                    const cellDate = new Date(viewYear, viewMonth, cell.day);
                    const isSelected = cell.cur && selectedDate
                        && cellDate.toDateString() === selectedDate.toDateString();
                    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                    const hasPending = cell.cur && markedDays.has(key);
                    const hasAdmitted = cell.cur && admittedDays.has(key);

                    return (
                        <button key={i} onClick={() => cell.cur && onSelectDate(cellDate)}
                            className={`aspect-square p-1 rounded-lg text-sm relative flex flex-col items-center justify-center transition-colors
                                ${!cell.cur ? 'text-gray-300 cursor-default' : ''}
                                ${isToday ? 'bg-purple-100 font-bold text-purple-700' : ''}
                                ${isSelected && !isToday ? 'bg-purple-50 font-semibold text-purple-700' : ''}
                                ${cell.cur && !isToday && !isSelected ? 'text-gray-900 hover:bg-gray-50' : ''}`}
                        >
                            <span>{cell.day}</span>
                            {(hasPending || hasAdmitted) && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                    {hasPending && <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-purple-400' : 'bg-purple-500'}`} />}
                                    {hasAdmitted && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-[10px] text-gray-400">Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-gray-400">Admitted</span>
                </div>
            </div>
        </div>
    );
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────
function MeetingCard({ interview, onCopy, onCancel, onResult }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const { label, status } = getTimeInfo(interview.scheduled_at);

    const handleCancel = async () => {
        setMenuOpen(false);
        if (!window.confirm('Cancel this meeting?')) return;
        try {
            await updateInterview(interview.id, { status: 'cancelled' });
            onCancel(interview.id);
            toast.success('Meeting cancelled');
        } catch { toast.error('Failed to cancel meeting'); }
    };

    const handleResult = async (result) => {
        try {
            await updateInterview(interview.id, { result });
            onResult(interview.id, result);
            toast.success(result === 'admitted' ? 'Student admitted ✓' : 'Interview rejected');
        } catch { toast.error('Failed to update result'); }
    };

    const statusColor = { today: 'text-emerald-600', tomorrow: 'text-amber-500', upcoming: 'text-gray-400' }[status];
    const borderColor = interview.status === 'cancelled' ? 'border-gray-200'
        : interview.result === 'admitted' ? 'border-emerald-400'
            : status === 'today' ? 'border-emerald-400'
                : status === 'tomorrow' ? 'border-amber-400'
                    : 'border-purple-400';

    return (
        <div className={`border-l-2 pl-4 py-3 group relative ${borderColor} ${interview.status === 'cancelled' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-gray-900">{interview.student_name}</span>
                        {interview.status === 'cancelled' && (
                            <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">CANCELLED</span>
                        )}
                        {interview.result === 'admitted' && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">ADMITTED</span>
                        )}
                    </div>

                    <div className="mb-1.5">
                        <span className={`text-xs font-medium ${statusColor}`}>{label}</span>
                    </div>

                    {interview.project_title && (
                        <div className="flex items-center gap-1.5 mb-2">
                            <FolderOpen size={10} className="text-gray-400" />
                            <span className="text-[11px] text-gray-400">{interview.project_title}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 mb-3">
                        <Users size={10} className="text-gray-400" />
                        <span className="text-[11px] text-gray-400">{interview.student_email || interview.student_name}</span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                        {interview.meeting_link ? (
                            <>
                                <button onClick={() => window.open(interview.meeting_link, '_blank')}
                                    disabled={interview.status === 'cancelled'}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    <Video size={11} /> Join Sync
                                </button>
                                <button onClick={() => onCopy(interview.meeting_link)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-500 text-[11px] rounded-lg hover:bg-gray-50 transition-colors">
                                    <Link2 size={11} /> Copy Link
                                </button>
                            </>
                        ) : (
                            <span className="text-xs text-gray-400 italic">No meeting link</span>
                        )}

                        {interview.status !== 'cancelled' && !interview.result && (
                            <div className="flex items-center gap-1.5 ml-1">
                                <button onClick={() => handleResult('admitted')}
                                    className="flex items-center gap-1 px-2.5 py-1.5 border border-emerald-200 text-emerald-600 text-[10px] font-semibold rounded-lg hover:bg-emerald-50 transition-colors">
                                    <CheckCircle size={10} /> Admit
                                </button>
                                <button onClick={() => handleResult('rejected')}
                                    className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-500 text-[10px] font-semibold rounded-lg hover:bg-red-50 transition-colors">
                                    <X size={10} /> Reject
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setMenuOpen(v => !v)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                        <MoreVertical size={14} className="text-gray-400" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[140px]">
                            {interview.status !== 'cancelled' && (
                                <button onClick={handleCancel} className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50">
                                    Cancel meeting
                                </button>
                            )}
                            <button
                                onClick={() => { navigator.clipboard.writeText(interview.meeting_link || interview.id); setMenuOpen(false); toast.success('Copied'); }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:bg-gray-50">
                                Copy link
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Plan Meeting Modal ───────────────────────────────────────────────────────
function PlanMeetingModal({ onClose, onCreated }) {
    const [step, setStep] = useState(1);
    const [projects, setProjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ project_id: '', student_id: '', date: '', time: '', meeting_link: '' });

    useEffect(() => {
        getProjects()
            .then(res => {
                const raw = toArray(res);
                console.log('[Meetings] raw projects:', raw); // debug — remove after confirming
                setProjects(raw.map(normaliseProject));
            })
            .catch(() => toast.error('Could not load projects'))
            .finally(() => setLoadingProjects(false));
    }, []);

    useEffect(() => {
        if (!form.project_id) { setStudents([]); return; }
        setLoadingStudents(true);
        getStudentsList()
            .then(res => setStudents(toArray(res)))
            .catch(() => toast.error('Could not load students'))
            .finally(() => setLoadingStudents(false));
    }, [form.project_id]);

    const selectProject = (id) => {
        const clean = String(id).trim();
        setForm(f => ({ ...f, project_id: clean, student_id: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.project_id || !form.date || !form.time) return;
        const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString();
        setSubmitting(true);
        try {
            const payload = {
                project_id: form.project_id,
                scheduled_at,
                ...(form.student_id ? { student_id: form.student_id } : {}),
                ...(form.meeting_link ? { meeting_link: form.meeting_link } : {}),
            };
            const res = await scheduleInterview(payload);
            toast.success(Array.isArray(res.data) ? `${res.data.length} meetings scheduled` : 'Meeting scheduled');
            onCreated(res.data);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to schedule meeting');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedProject = projects.find(p => p.id === form.project_id);

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Plan Meeting</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {step === 1 ? 'Step 1 — Choose a project' : `Step 2 — ${selectedProject?.title || 'Details'}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="flex px-6 pt-4 gap-2">
                    {[1, 2].map(n => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= n ? 'bg-purple-500' : 'bg-gray-100'}`} />
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

                    {/* ── Step 1 ── */}
                    {step === 1 && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-2 tracking-wide uppercase">
                                    Select Project
                                </label>
                                {loadingProjects ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
                                        <RefreshCw size={12} className="animate-spin" /> Loading projects…
                                    </div>
                                ) : projects.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-2">No projects found.</p>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {projects.map(p => {
                                            const isSelected = form.project_id === p.id;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => selectProject(p.id)}
                                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all
                                                        ${isSelected
                                                            ? 'border-purple-400 bg-purple-50 shadow-sm'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-gray-900 truncate">{p.title}</div>
                                                            {p.status && (
                                                                <div className="text-[11px] text-gray-400 mt-0.5 capitalize">{p.status}</div>
                                                            )}
                                                        </div>
                                                        {isSelected && <CheckCircle size={15} className="text-purple-500 flex-shrink-0" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                disabled={!form.project_id}
                                onClick={() => setStep(2)}
                                className="w-full py-3 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </>
                    )}

                    {/* ── Step 2 ── */}
                    {step === 2 && (
                        <>
                            <button type="button" onClick={() => setStep(1)}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors -mt-1 mb-1">
                                <ChevronLeft size={12} /> Back to project
                            </button>

                            {/* Student */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Student</label>
                                {loadingStudents ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                                        <RefreshCw size={12} className="animate-spin" /> Loading students…
                                    </div>
                                ) : (
                                    <select
                                        value={form.student_id}
                                        onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
                                    >
                                        <option value="">All students in project</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.first_name} {s.last_name}{s.domain ? ` — ${s.domain}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {!form.student_id && (
                                    <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                                        Leaving blank schedules a meeting for every active student in this project.
                                    </p>
                                )}
                            </div>

                            {/* Date + Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Date</label>
                                    <input type="date" value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                                        required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Time</label>
                                    <input type="time" value={form.time}
                                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                                        required />
                                </div>
                            </div>

                            {/* Meeting link */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">
                                    Meeting Link
                                    <span className="ml-1.5 font-normal text-gray-400 normal-case">(optional — Jitsi auto-generated)</span>
                                </label>
                                <input type="url" value={form.meeting_link}
                                    onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))}
                                    placeholder="https://meet.jit.si/..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
                            </div>

                            <button type="submit"
                                disabled={submitting || !form.date || !form.time}
                                className="w-full py-3 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                                {submitting && <RefreshCw size={14} className="animate-spin" />}
                                {submitting ? 'Scheduling…' : form.student_id ? 'Create Meeting' : 'Create Meetings for All'}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const Meetings = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchInterviews = () => {
        setLoading(true);
        setError(null);
        getInterviews()
            .then(res => {
                const data = toArray(res);
                setInterviews(data);
                if (data.some(i => i.meeting_link && i.status !== 'cancelled' && isLiveSoon(i.scheduled_at)))
                    setShowBanner(true);
            })
            .catch(err => setError(err.response?.data?.error || 'Failed to load meetings'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchInterviews(); }, []);

    // Rejected are hidden everywhere except the capacity counters
    const visibleInterviews = interviews.filter(i => i.result !== 'rejected');

    const markedDays = new Set(
        visibleInterviews.filter(i => i.status !== 'cancelled' && i.result !== 'admitted').map(i => toDateKey(i.scheduled_at))
    );
    const admittedDays = new Set(
        visibleInterviews.filter(i => i.result === 'admitted').map(i => toDateKey(i.scheduled_at))
    );

    const liveMeeting = visibleInterviews.find(i => i.meeting_link && i.status !== 'cancelled' && isLiveSoon(i.scheduled_at));
    const activeSlots = visibleInterviews.filter(i => i.status !== 'cancelled' && new Date(i.scheduled_at) > new Date()).length;
    const todayInterviews = visibleInterviews.filter(i => new Date(i.scheduled_at).toDateString() === new Date().toDateString());
    const upcomingInterviews = visibleInterviews.filter(i => i.status !== 'cancelled' && new Date(i.scheduled_at) > new Date()).slice(0, 5);
    const selectedDateInterviews = visibleInterviews.filter(i => new Date(i.scheduled_at).toDateString() === selectedDate.toDateString());

    const handleCopy = (link) => { navigator.clipboard.writeText(link); toast.success('Link copied'); };
    const handleCreated = (data) => {
        const items = Array.isArray(data) ? data : [data];
        setInterviews(prev => [...items, ...prev]);
        if (items[0]?.scheduled_at) setSelectedDate(new Date(items[0].scheduled_at));
    };
    const handleCancel = (id) => setInterviews(prev => prev.map(i => i.id === id ? { ...i, status: 'cancelled' } : i));
    const handleResult = (id, result) => setInterviews(prev => prev.map(i => i.id === id ? { ...i, result } : i));

    return (
        <div className="px-8 py-8">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Meeting Schedule</h1>
                    <p className="text-sm text-gray-500">Plan and manage sync sessions with student teams.</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-sm">
                    <Plus size={15} /> Plan Meeting
                </button>
            </div>

            {showBanner && liveMeeting && <LiveBanner interview={liveMeeting} onDismiss={() => setShowBanner(false)} />}

            <div className="grid grid-cols-3 gap-6">

                {/* Left col */}
                <div className="col-span-2 space-y-4">
                    <MiniCalendar
                        markedDays={markedDays}
                        admittedDays={admittedDays}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />

                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 text-sm">
                                {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            {selectedDateInterviews.length > 0 && (
                                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                    {selectedDateInterviews.length} meeting{selectedDateInterviews.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="space-y-6">
                                {[1, 2].map(n => (
                                    <div key={n} className="border-l-2 border-gray-100 pl-4 py-2 space-y-2 animate-pulse">
                                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                                        <div className="h-3 bg-gray-100 rounded w-1/4" />
                                        <div className="h-7 bg-gray-100 rounded w-1/3" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                                <AlertCircle size={15} className="flex-shrink-0" />
                                {error}
                                <button onClick={fetchInterviews} className="ml-auto text-xs underline flex items-center gap-1">
                                    <RefreshCw size={11} /> Retry
                                </button>
                            </div>
                        ) : selectedDateInterviews.length === 0 ? (
                            <div className="py-8 text-center">
                                <CalendarDays size={20} className="text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No meetings on this day.</p>
                                <button onClick={() => setShowModal(true)} className="mt-2 text-xs text-purple-600 font-medium hover:underline">
                                    Schedule one →
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {selectedDateInterviews.map(interview => (
                                    <MeetingCard key={interview.id} interview={interview}
                                        onCopy={handleCopy} onCancel={handleCancel} onResult={handleResult} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    {todayInterviews.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Today</h3>
                            <div className="space-y-5">
                                {todayInterviews.map(interview => (
                                    <MeetingCard key={interview.id} interview={interview}
                                        onCopy={handleCopy} onCancel={handleCancel} onResult={handleResult} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Upcoming</h3>
                        {upcomingInterviews.length === 0 ? (
                            <div className="text-center py-6">
                                <Clock size={18} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No upcoming meetings</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {upcomingInterviews.map(interview => (
                                    <MeetingCard key={interview.id} interview={interview}
                                        onCopy={handleCopy} onCancel={handleCancel} onResult={handleResult} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-900 rounded-xl px-5 py-5">
                        <h2 className="text-sm font-bold text-white mb-1">Expert Capacity</h2>
                        <p className="text-xs text-gray-400 mb-4">Your sync load at a glance.</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/5 rounded-lg px-3 py-2.5 text-center">
                                <div className="text-xl font-bold text-white">{activeSlots}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Active slots</div>
                            </div>
                            <div className="bg-white/5 rounded-lg px-3 py-2.5 text-center">
                                <div className="text-xl font-bold text-white">{todayInterviews.length}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Today</div>
                            </div>
                            <div className="bg-white/5 rounded-lg px-3 py-2.5 text-center">
                                <div className="text-xl font-bold text-emerald-400">
                                    {interviews.filter(i => i.result === 'admitted').length}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Admitted</div>
                            </div>
                            <div className="bg-white/5 rounded-lg px-3 py-2.5 text-center">
                                <div className="text-xl font-bold text-red-400">
                                    {interviews.filter(i => i.result === 'rejected').length}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Rejected</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && <PlanMeetingModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
        </div>
    );
};

export default Meetings;