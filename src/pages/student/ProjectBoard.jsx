import { useState, useEffect } from 'react';
import { Star, Calendar, FolderOpen, Check, AlertTriangle, CheckSquare } from 'lucide-react';
import {
  getMyApplications, getMyProjects, getEarnings,
  getMyInterviews, getMyTasks,
} from '../../api/student.api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function ProjectBoard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeProjects, setActiveProjects] = useState([]);
  const [xpData, setXpData] = useState({ current: 0, total: 3000, level: 1 });
  const [alerts, setAlerts] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [appsRes, projRes, earningsRes, interviewsRes, tasksRes] = await Promise.allSettled([
          getMyApplications(),
          getMyProjects(),
          getEarnings(),
          getMyInterviews(),
          getMyTasks(),
        ]);

        // ── XP ──
        if (appsRes.status === 'fulfilled') {
          const apps = appsRes.value.data || [];
          const completed = apps.filter(a => a.status === 'selected').length;
          const xp = completed * 450;
          const level = Math.floor(xp / 3000) + 1;
          setXpData({ current: xp % 3000, total: 3000, level });
        }

        // ── Active projects ──
        if (projRes.status === 'fulfilled') {
          const projs = projRes.value.data || [];
          const active = projs.filter(p =>
            ['in_progress', 'in_review', 'accepted'].includes(p.status)
          );
          setActiveProjects(active);
          setAlerts(projs.filter(p => p.status === 'in_review').slice(0, 1));
        }

        // ── Tasks as todos ──
        if (tasksRes.status === 'fulfilled') {
          const myTasks = (tasksRes.value.data || []).slice(0, 6).map(t => ({
            id: t.id,
            text: t.title || t.description,
            subtitle: t.project_title,
            done: t.status === 'in_progress',
            project_id: t.project_id,
            status: t.status,
          }));
          setTodos(myTasks);
        }

        // ── Upcoming interviews ──
        if (interviewsRes.status === 'fulfilled') {
          const now = new Date();
          const upcoming = (interviewsRes.value.data || [])
            .filter(i => i.status === 'scheduled' && new Date(i.scheduled_at) >= now)
            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
            .slice(0, 3);
          setInterviews(upcoming);
        }

      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const firstName = user?.first_name || 'there';
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  const formatMeetingTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow'
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return { time, label };
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1">Welcome back, {firstName}</h1>
          <p className="text-gray-400 text-base">Here's your overview for today, {today}.</p>
        </div>

        {/* XP Badge */}
        <div className="flex items-center gap-4 bg-purple-50 border border-purple-100 rounded-2xl px-6 py-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Star size={22} className="text-purple-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-0.5">EXP Points</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{xpData.current.toLocaleString()} XP</span>
              <span className="text-base font-semibold text-gray-400">Level {xpData.level}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 cols */}
        <div className="col-span-2 space-y-6">

          {/* Alert — project in review */}
          {alerts.map(project => (
            <div key={project.project_id || project.id}
              className="bg-white border border-amber-100 rounded-2xl px-6 py-5 flex items-center gap-5 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-gray-900">{project.title}</div>
                <div className="text-sm text-gray-400 mt-0.5">
                  This project is in review — awaiting expert approval.
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="px-4 py-1.5 bg-amber-400 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                  In Review
                </span>
                <button
                  onClick={() => navigate(`/student/projects/${project.project_id || project.id}`)}
                  className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ))}

          {/* Ongoing Projects */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <FolderOpen size={20} className="text-gray-500" />
              <h2 className="text-xl font-bold text-gray-900">Ongoing Projects</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeProjects.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center shadow-sm">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen size={22} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No ongoing projects</p>
                <p className="text-sm text-gray-400 mt-1">Apply to projects to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.map((project) => {
                  const pid = project.project_id || project.id;
                  const totalTasks = Number(project.total_tasks || 0);
                  const doneTasks = Number(project.completed_tasks || 0);
                  const completion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                  return (
                    <div key={pid}
                      className="bg-white border border-gray-100 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg flex-shrink-0">
                          {getInitials(project.client_name || project.title)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base mb-1">
                            {project.client_name || 'Project'} — {project.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-400">
                              Expert: {project.expert_name || 'Not assigned'}
                            </span>
                            <span className="text-purple-500 font-semibold">
                              {doneTasks}/{totalTasks} tasks · {completion}%
                            </span>
                          </div>
                        </div>

                        <div className="w-44 flex-shrink-0">
                          <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${completion}%`,
                                background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                              }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/student/projects/${pid}`)}
                          className="flex-shrink-0 px-5 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Tasks as Todos */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-purple-500" />
                <h3 className="font-bold text-gray-900 text-base">My Tasks</h3>
              </div>
              {todos.filter(t => !t.done).length > 0 && (
                <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-[11px] font-bold rounded-full">
                  {todos.filter(t => !t.done).length} open
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-6 flex justify-center">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : todos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No pending tasks</p>
            ) : (
              <div className="space-y-3">
                {todos.map(todo => (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => navigate(`/student/projects/${todo.project_id}`)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${todo.done
                      ? 'bg-purple-500 border-purple-500'
                      : 'border-gray-300'
                      }`}>
                      {todo.done && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <div>
                      <p className={`text-sm leading-snug ${todo.done ? 'text-gray-400' : 'text-gray-700'}`}>
                        {todo.text}
                      </p>
                      {todo.subtitle && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{todo.subtitle}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interviews as Meetings */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Calendar size={18} className="text-purple-500" />
              <h3 className="font-bold text-gray-900 text-base">Upcoming Interviews</h3>
            </div>

            {loading ? (
              <div className="py-6 flex justify-center">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : interviews.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No upcoming interviews</p>
            ) : (
              <div className="space-y-5">
                {interviews.map(interview => {
                  const { time, label } = formatMeetingTime(interview.scheduled_at);
                  return (
                    <div key={interview.id} className="flex gap-4">
                      <div className="w-1 rounded-full bg-purple-500 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900">{time}</span>
                          <span className="text-xs text-purple-500 font-semibold">{label}</span>
                        </div>
                        <div className="font-semibold text-sm text-gray-900">Interview</div>
                        {interview.expert_name && (
                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-0.5">
                            with {interview.expert_name}
                          </div>
                        )}
                        {interview.meeting_link && (
                          <a
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-500 font-semibold mt-1 inline-block"
                          >
                            Join meeting →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => navigate('/student/agenda')}
              className="w-full mt-6 py-2 text-xs font-bold text-purple-500 hover:bg-purple-50 rounded-xl transition-colors tracking-widest uppercase"
            >
              View Full Agenda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}