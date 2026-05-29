import { useState, useEffect } from 'react';
import {
  Search, Star, Users, MapPin, BookOpen, ExternalLink,
  FileText, Calendar, X, RefreshCw, AlertCircle,
  CheckCircle, Clock, Filter, ChevronDown,
} from 'lucide-react';
import { scheduleInterview, getPendingStudents } from '../../api/expert.api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DOMAIN_LABEL = {
  web_dev: 'Web Dev',
  mobile_dev: 'Mobile Dev',
  ui_ux_design: 'UI/UX Design',
  video_editing: 'Video Editing',
  other: 'Other',
};

const DOMAIN_COLOR = {
  web_dev: 'bg-blue-50 text-blue-700 border-blue-100',
  mobile_dev: 'bg-violet-50 text-violet-700 border-violet-100',
  ui_ux_design: 'bg-pink-50 text-pink-700 border-pink-100',
  video_editing: 'bg-amber-50 text-amber-700 border-amber-100',
  other: 'bg-gray-50 text-gray-600 border-gray-100',
};

function StarRating({ value }) {
  const stars = Math.round((Number(value || 0) / 10) * 5);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={11}
          className={s <= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
      <span className="text-xs text-gray-500 ml-1">{Number(value || 0).toFixed(1)}</span>
    </span>
  );
}

function Avatar({ name, size = 'md' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const sizeClass = size === 'lg'
    ? 'w-16 h-16 text-lg'
    : size === 'sm'
      ? 'w-8 h-8 text-xs'
      : 'w-10 h-10 text-sm';
  // deterministic color from name
  const colors = [
    'bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700',
    'bg-pink-100 text-pink-700', 'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700', 'bg-indigo-100 text-indigo-700',
    'bg-orange-100 text-orange-700', 'bg-teal-100 text-teal-700',
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Interview Modal ──────────────────────────────────────────────────────────
function InterviewModal({ student, onClose, onScheduled }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) return;
    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    setSubmitting(true);
    try {
      await scheduleInterview({
        student_id: student.id,
        scheduled_at,
        ...(link ? { meeting_link: link } : {}),
      });
      toast.success(`Interview scheduled with ${student.first_name}!`);
      onScheduled();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Schedule Interview</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              with {student.first_name} {student.last_name}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Meeting Link
              <span className="ml-1.5 font-normal normal-case text-gray-400">(optional — Jitsi auto-generated)</span>
            </label>
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://meet.jit.si/..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !date || !time}
            className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting
              ? <><RefreshCw size={14} className="animate-spin" /> Scheduling…</>
              : <><Calendar size={14} /> Schedule Interview</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Student Profile Modal ────────────────────────────────────────────────────
function ProfileModal({ student, onClose, onSchedule }) {
  const fullName = `${student.first_name} ${student.last_name}`;
  const domainLabel = DOMAIN_LABEL[student.domain] || student.domain;
  const domainColor = DOMAIN_COLOR[student.domain] || DOMAIN_COLOR.other;

  const INFO = [
    { icon: BookOpen, label: 'University', value: student.university || '—' },
    { icon: MapPin, label: 'Wilaya', value: student.wilaya || '—' },
    { icon: Star, label: 'Rating', value: `${Number(student.global_rating || 0).toFixed(1)} / 10` },
    { icon: Users, label: 'Projects', value: `${student.consecutive_projects || 0} active` },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Avatar name={fullName} size="lg" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${domainColor}`}>
                  {domainLabel}
                </span>
                <span className="text-xs text-gray-400">{student.email}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 flex-shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <StarRating value={student.global_rating} />
            <span className="text-xs text-gray-400">global rating</span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {INFO.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon size={11} className="text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{value}</span>
              </div>
            ))}
          </div>

          {/* Bio */}
          {(student.bio || student.student?.bio) && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Bio</div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {student.bio || student.student?.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {(student.skills || student.student?.skills) && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {(student.skills || student.student?.skills || '').split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                  <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex items-center gap-3">
            {(student.cv_url || student.student?.cv_url) && (
              <a
                href={student.cv_url || student.student?.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FileText size={13} /> View CV
              </a>
            )}
            {(student.portfolio_url || student.student?.portfolio_url) && (
              <a
                href={student.portfolio_url || student.student?.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={13} /> Portfolio
              </a>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => { onClose(); onSchedule(student); }}
            className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Calendar size={14} /> Schedule Interview
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Student Card ─────────────────────────────────────────────────────────────
function StudentCard({ student, onView, onSchedule }) {
  const fullName = `${student.first_name} ${student.last_name}`;
  const domainLabel = DOMAIN_LABEL[student.domain] || student.domain;
  const domainColor = DOMAIN_COLOR[student.domain] || DOMAIN_COLOR.other;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-400 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3 mb-4">
        <Avatar name={fullName} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">{fullName}</div>
          <div className="text-xs text-gray-400 truncate">{student.email}</div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${domainColor}`}>
          {domainLabel}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <StarRating value={student.global_rating} />
        {student.university && (
          <span className="text-[11px] text-gray-400 truncate">{student.university}</span>
        )}
      </div>

      {/* Skills preview */}
      {(student.skills || student.student?.skills) && (
        <div className="flex flex-wrap gap-1 mb-4">
          {(student.skills || student.student?.skills || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 3).map(skill => (
            <span key={skill} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(student)}
          className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={() => onSchedule(student)}
          className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <Calendar size={11} /> Interview
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function StudentPipeline() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomain] = useState('all');
  const [viewStudent, setView] = useState(null);   // profile modal
  const [schedStudent, setSched] = useState(null);   // interview modal
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch all pending students
  useEffect(() => {
    setLoading(true);
    setError(null);
    getPendingStudents()
      .then(res => setStudents(Array.isArray(res.data) ? res.data : []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load students'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const DOMAINS = ['all', ...new Set(students.map(s => s.domain).filter(Boolean))];

  const filtered = students.filter(s => {
    const name = `${s.first_name} ${s.last_name} ${s.email} ${s.university || ''}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchDomain = domainFilter === 'all' || s.domain === domainFilter;
    return matchSearch && matchDomain;
  });

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Student Pipeline</h1>
          <p className="text-sm text-gray-500">
            {students.length} pending student{students.length !== 1 ? 's' : ''} awaiting vetting
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl flex-1 max-w-sm">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, university…"
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Domain filter */}
        <div className="flex gap-1.5 flex-wrap">
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${domainFilter === d
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
            >
              {d === 'all' ? 'All' : DOMAIN_LABEL[d] || d}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white border border-gray-100 rounded-2xl p-5 h-48 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="h-7 bg-gray-100 rounded-xl flex-1" />
                <div className="h-7 bg-gray-100 rounded-xl flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
          <button onClick={() => setRefreshKey(k => k + 1)} className="ml-auto text-xs underline flex items-center gap-1">
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Users size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search || domainFilter !== 'all'
              ? 'No students match your filters.'
              : 'No pending students at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onView={setView}
              onSchedule={setSched}
            />
          ))}
        </div>
      )}

      {/* Profile modal */}
      {viewStudent && (
        <ProfileModal
          student={viewStudent}
          onClose={() => setView(null)}
          onSchedule={(s) => { setView(null); setSched(s); }}
        />
      )}

      {/* Interview modal */}
      {schedStudent && (
        <InterviewModal
          student={schedStudent}
          onClose={() => setSched(null)}
          onScheduled={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}