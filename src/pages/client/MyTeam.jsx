import { useState, useEffect } from 'react';
import { Users, MessageSquare, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getClientProjects } from '../../api/client.api';
import api from '../../api/axiosInstance';

const initials = (name = '') =>
  name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

const ROLE_LABEL = {
  expert:  { label: 'Expert',   color: 'bg-[#f5f3ff] text-[#7c3aed]'  },
  student: { label: 'Student',  color: 'bg-[#f0fdf4] text-green-700'   },
};

export default function MyTeam() {
  const navigate = useNavigate();
  const [teams,   setTeams]   = useState([]); // [{ project, members[] }]
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getClientProjects()
      .then(async res => {
        const projects = (res.data || []).filter(p =>
          ['in_progress', 'accepted', 'in_review', 'delivered'].includes(p.status)
        );
        // fetch team for each project
        const results = await Promise.allSettled(
          projects.map(p =>
            api.get(`/projects/${p.project_id || p.id}/team`)
              .then(r => ({ project: p, members: r.data || [] }))
          )
        );
        setTeams(results.filter(r => r.status === 'fulfilled').map(r => r.value));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const allMembers = teams.flatMap(t => t.members.map(m => ({ ...m, project: t.project })));
  const uniqueMembers = Object.values(
    allMembers.reduce((acc, m) => { acc[m.id] = acc[m.id] || m; return acc; }, {})
  );

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">My Team</h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            Experts and students working with you across all projects.
          </p>
        </div>
        {!loading && uniqueMembers.length > 0 && (
          <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-2xl px-5 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ede9fe] flex items-center justify-center">
              <Users size={16} className="text-[#7c3aed]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest">Team size</div>
              <div className="text-xl font-bold text-[#111827]">{uniqueMembers.length}</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-600">
          Failed to load team: {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white border border-[#ede9fe] rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f3ff] flex items-center justify-center mb-4">
            <Users size={22} className="text-[#7c3aed]" />
          </div>
          <div className="text-sm font-semibold text-[#374151] mb-1">No team members yet</div>
          <div className="text-[12px] text-[#9ca3af] mb-5">
            Team members appear here once a project is assigned and started.
          </div>
          <button
            onClick={() => navigate('/client/request-project')}
            className="px-5 py-2.5 bg-[#7c3aed] text-white text-[11px] font-bold rounded-xl uppercase tracking-widest"
          >
            Request a Project
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {teams.map(({ project, members }) => {
            const pid = project.project_id || project.id;
            return (
              <div key={pid} className="bg-white rounded-2xl border border-[#ede9fe] overflow-hidden">
                {/* Project header */}
                <div className="px-6 py-4 border-b border-[#f5f3ff] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ede9fe] flex items-center justify-center text-xs font-bold text-[#7c3aed]">
                      {initials(project.title)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#111827]">{project.title}</div>
                      <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">
                        {project.service_type?.replace(/_/g, ' ')} · {members.length} member{members.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/client/projects/${pid}`)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest"
                  >
                    View Project <ChevronRight size={12} />
                  </button>
                </div>

                {/* Members */}
                {members.length === 0 ? (
                  <div className="px-6 py-6 text-[12px] text-[#9ca3af] text-center">
                    No team members assigned yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#f5f3ff]">
                    {members.map(m => {
                      const roleConf = ROLE_LABEL[m.role] || { label: m.role, color: 'bg-gray-100 text-gray-600' };
                      return (
                        <div key={m.id} className="px-6 py-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#ede9fe] flex items-center justify-center text-sm font-bold text-[#7c3aed] flex-shrink-0">
                            {initials(m.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[#111827]">{m.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${roleConf.color}`}>
                                {roleConf.label}
                              </span>
                              {m.domain && (
                                <span className="text-[10px] text-[#9ca3af] uppercase tracking-widest">
                                  {m.domain.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                          {m.global_rating != null && (
                            <div className="flex items-center gap-1 text-[12px] font-bold text-[#7c3aed]">
                              <Star size={12} className="text-[#7c3aed]" />
                              {Number(m.global_rating).toFixed(1)}
                            </div>
                          )}
                          <button
                            onClick={() => navigate('/client/messages')}
                            className="w-9 h-9 rounded-xl border border-[#ede9fe] flex items-center justify-center hover:bg-[#f5f3ff] transition-colors"
                          >
                            <MessageSquare size={14} className="text-[#7c3aed]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}