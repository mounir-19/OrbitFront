import { useState, useEffect } from 'react';
import { Star, Zap, TrendingUp, FolderOpen, RefreshCw, Code, Video, Palette, BarChart2, CheckCircle } from 'lucide-react'; import { getProjectBoard, applyToProject, getMyRatings, getEarnings, getMyApplications } from '../../api/student.api';
import { getMe } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const categoryIcon = {
  web_dev: <Code size={16} className="text-indigo-500" />,
  mobile_dev: <Code size={16} className="text-indigo-500" />,
  ui_ux_design: <Palette size={16} className="text-pink-400" />,
  video_editing: <Video size={16} className="text-orange-400" />,
  'Web Development': <Code size={16} className="text-indigo-500" />,
  'Video Editing': <Video size={16} className="text-orange-400" />,
  'UI/UX Design': <Palette size={16} className="text-pink-400" />,
  'Data Science': <BarChart2 size={16} className="text-teal-400" />,
};

export default function ProjectBoard() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [applying, setApplying] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ rating: '—', xp: 0, xpMax: 1000, earned: '0', projects: 0, active: 0, inReview: 0, level: 1, levelName: 'Beginner' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [projectsRes, applicationsRes] = await Promise.allSettled([
        getProjectBoard(),
        getMyApplications(),
      ]);

      if (projectsRes.status === 'fulfilled') {
        setProjects(projectsRes.value.data || []);
      }

      if (applicationsRes.status === 'fulfilled') {
        const apps = applicationsRes.value.data || [];
        const ids = new Set(apps.map(a => a.project_id));
        setAppliedIds(ids);

        const active = apps.filter(a => a.status === 'selected').length;
        const inReview = apps.filter(a => a.status === 'shortlisted').length;
        setStats(s => ({ ...s, active, inReview, projects: apps.length }));
      }
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApply = async (id) => {
    setApplying(id);
    try {
      await applyToProject(id, { message: '' });
      setAppliedIds(prev => new Set([...prev, id]));
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not apply';
      alert(msg);
    } finally {
      setApplying(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll().finally(() => setRefreshing(false));
  };

  const firstName = user?.first_name || 'there';

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hey {firstName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading your board...' : `${projects.length} briefs available. Check your applications below.`}
          </p>
        </div>
        <button onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /> Rating</div>
          <div className="text-2xl font-bold text-gray-900">{stats.rating}</div>
        </div>
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1"><Zap size={14} className="text-indigo-500" /> Level {stats.level}</div>
          <div className="text-2xl font-bold text-gray-900">{stats.xp}<span className="text-sm font-normal text-gray-400"> /{stats.xpMax} XP</span></div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(stats.xp / stats.xpMax) * 100}%` }} />
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1"><TrendingUp size={14} className="text-green-500" /> Earned</div>
          <div className="text-2xl font-bold text-gray-900">{stats.earned} DZD</div>
        </div>
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1"><FolderOpen size={14} className="text-gray-400" /> Active</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats.active}</span>
            <span className="text-xs text-gray-400">{stats.inReview} in review</span>
          </div>
        </div>
      </div>

      {/* Project board */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span className="font-semibold text-gray-900">Project board</span>
          <span className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
            <Zap size={11} /> Matched for you
          </span>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No open projects in your domain right now.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {projects.map((p) => {
              const applied = appliedIds.has(p.project_id || p.id);
              const id = p.project_id || p.id;
              const category = p.service_type || p.category;
              return (
                <div key={id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {categoryIcon[category] || <Code size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-900 text-sm">{p.title}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span>{category}</span><span>·</span>
                      <span>{p.client_name || p.client}</span><span>·</span>
                      <span>Expert: {p.expert_name || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-indigo-600">{p.total_price ? `${Number(p.total_price).toLocaleString()} DZD` : '—'}</div>
                      <div className="text-xs text-gray-400">{p.team_size} needed</div>
                    </div>
                    {applied ? (
                      <button disabled className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-sm cursor-not-allowed">
                        <CheckCircle size={14} /> Applied
                      </button>
                    ) : (
                      <button onClick={() => handleApply(id)} disabled={applying === id}
                        className="px-4 py-1.5 rounded-lg bg-indigo-700 text-white text-sm font-medium hover:bg-indigo-800 disabled:opacity-60 transition-colors">
                        {applying === id ? 'Applying...' : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}