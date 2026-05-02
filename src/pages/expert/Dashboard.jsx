import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, UserCheck, Bell, AlertTriangle, Sparkles } from 'lucide-react';
import { getProjects, getApplications, getMyEarnings } from '../../api/expert.api';
import { useAuthStore } from '../../store/authStore';

const statusColor = {
  in_progress: 'text-green-600 bg-green-50',
  under_review: 'text-amber-600 bg-amber-50',
  accepted: 'text-indigo-600 bg-indigo-50',
  delivered: 'text-blue-600 bg-blue-50',
};

export default function ExpertDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [projects, setProjects] = useState([]);
  const [applications, setApps] = useState([]);
  const [stats, setStats] = useState({ active: 0, review: 0, students: 0, ai: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getProjects(),
      getApplications(undefined, { status: 'pending' }),
    ]).then(([projRes, appsRes]) => {
      if (projRes.status === 'fulfilled') {
        const data = projRes.value.data || [];
        setProjects(data.slice(0, 4));
        setStats(s => ({
          ...s,
          active: data.filter(p => p.status === 'in_progress').length,
          review: data.filter(p => p.status === 'under_review').length,
        }));
      }
      if (appsRes.status === 'fulfilled') {
        const data = appsRes.value.data || [];
        setApps(data.slice(0, 5));
        setStats(s => ({ ...s, students: data.length }));
      }
    }).finally(() => setLoading(false));
  }, []);

  const firstName = user?.first_name || 'Yacine';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}.</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${stats.active} projects active. ${stats.review} pending review.`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/expert/agenda')} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Bell size={14} /> Agenda
          </button>
          <button onClick={() => navigate('/expert/projects')} className="flex items-center gap-2 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">
            + New project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active projects', value: stats.active, sub: 'in progress', subColor: 'text-green-500' },
          { label: 'Pending review', value: stats.review, sub: 'awaiting you', subColor: 'text-red-500' },
          { label: 'Applicants', value: stats.students, sub: 'pending review', subColor: 'text-green-500' },
          { label: 'AI suggestions', value: '—', sub: 'run agents', subColor: 'text-indigo-500' },
        ].map(s => (
          <div key={s.label} className="border border-gray-200 rounded-xl px-5 py-4">
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              <span className={`text-xs font-medium ${s.subColor}`}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pending applications as alerts */}
      {applications.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pending applications</p>
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {applications.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 border-l-4 border-amber-400 hover:bg-gray-50 transition-colors">
                <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{a.first_name} {a.last_name}</span>
                  <span className="text-gray-400 text-sm">·</span>
                  <span className="text-gray-600 text-sm truncate">{a.project_title}</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </span>
                <button onClick={() => navigate('/expert/student-pipeline')} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Review</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Active projects */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Active projects</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{projects.length}</span>
            </div>
            <button onClick={() => navigate('/expert/projects')} className="text-sm text-indigo-600 hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="border border-gray-200 rounded-xl px-5 py-8 text-center text-sm text-gray-400">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="border border-gray-200 rounded-xl px-5 py-8 text-center text-sm text-gray-400">No projects yet.</div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {projects.map(p => {
                const id = p.project_id || p.id;
                const initials = (p.title || '?')[0].toUpperCase();
                return (
                  <div key={id} className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/expert/projects/${id}`)}>
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{p.title}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="capitalize">{p.service_type?.replace(/_/g, ' ')}</span>
                        <span>·</span>
                        <span>{p.client_name || '—'}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${statusColor[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI agents */}
        <div className="w-64 flex-shrink-0">
          <div className="border border-indigo-100 bg-indigo-50 rounded-xl px-4 py-4">
            <div className="font-semibold text-gray-900 mb-1">AI agents on standby</div>
            <p className="text-xs text-gray-600 mb-3">Break a project into tasks or rank applicants. Claude streams its reasoning so you can audit.</p>
            <div className="flex gap-2">
              <button onClick={() => navigate('/expert/task-breakdown')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">
                <Zap size={12} /> Task AI
              </button>
              <button onClick={() => navigate('/expert/team-matching')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">
                <UserCheck size={12} /> Match AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}