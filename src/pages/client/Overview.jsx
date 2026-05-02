import { useState, useEffect } from 'react';
import { TrendingUp, FolderOpen, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getClientProjects, getClientInvoices } from '../../api/client.api';
import { useAuthStore } from '../../store/authStore';

const statusColor = {
  in_progress: 'text-green-600',
  under_review: 'text-amber-600',
  delivered: 'text-indigo-700',
  accepted: 'text-blue-600',
};

export default function ClientOverview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getClientProjects(), getClientInvoices()])
      .then(([projRes, invRes]) => {
        if (projRes.status === 'fulfilled') setProjects(projRes.value.data || []);
        if (invRes.status === 'fulfilled') setInvoices(invRes.value.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.first_name || 'there';
  const company = user?.client?.company || '';

  const totalBudget = projects.reduce((s, p) => s + Number(p.total_price || 0), 0);
  const pendingInv = invoices.filter(i => i.status === 'pending');
  const fmt = n => Number(n).toLocaleString('fr-DZ');

  const attention = [
    ...pendingInv.map(i => ({
      label: `${i.project_title || 'Invoice'} — payment due`,
      sub: `${fmt(i.amount)} DZD`,
      action: 'Pay', urgent: true,
    })),
    ...projects.filter(p => p.status === 'under_review').map(p => ({
      label: `${p.title} — needs your sign-off`,
      sub: '', action: 'Open', urgent: false,
    })),
  ].slice(0, 4);

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading your projects...' :
              `${projects.length} project${projects.length !== 1 ? 's' : ''} active${pendingInv.length ? ` · ${pendingInv.length} payment${pendingInv.length !== 1 ? 's' : ''} pending` : ''}.`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <TrendingUp size={14} /> Report
          </button>
          <button onClick={() => navigate('/client/request-project')} className="flex items-center gap-2 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">
            <Zap size={14} /> Request project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={<FolderOpen size={14} />} label="Active projects">
          <span className="text-2xl font-bold">{projects.length}</span>
          {projects.filter(p => p.status === 'delivered').length > 0 && (
            <span className="text-xs text-green-500 ml-1">{projects.filter(p => p.status === 'delivered').length} delivered</span>
          )}
        </StatCard>
        <StatCard icon={<TrendingUp size={14} />} label="Committed budget">
          <div className="text-2xl font-bold">{fmt(totalBudget)} DZD</div>
          <div className="text-xs text-gray-400">{projects.length} projects</div>
        </StatCard>
        <StatCard icon={<Zap size={14} />} label="Pending payments">
          <div className="text-2xl font-bold">{fmt(pendingInv.reduce((s, i) => s + Number(i.amount || 0), 0))} DZD</div>
          <div className="text-xs text-gray-400">{pendingInv.length} invoice{pendingInv.length !== 1 ? 's' : ''}</div>
        </StatCard>
        <StatCard icon={<Star size={14} />} label="Team">
          <div className="text-2xl font-bold">{projects.reduce((s, p) => s + (p.team_size || 0), 0)}</div>
          <div className="text-xs text-gray-400">across all projects</div>
        </StatCard>
      </div>

      <div className="flex gap-6">
        {/* Projects */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-900">Your projects</span>
            <button onClick={() => navigate('/client/projects')} className="text-sm text-indigo-600 hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="border border-gray-200 rounded-xl px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="border border-gray-200 rounded-xl px-5 py-10 text-center text-sm text-gray-400">
              No projects yet.{' '}
              <button onClick={() => navigate('/client/request-project')} className="text-indigo-600 hover:underline">Request one</button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {projects.slice(0, 4).map(p => {
                const id = p.project_id || p.id;
                return (
                  <div key={id} className="px-5 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/client/projects/${id}`)}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                        {(p.title || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <div className="font-medium text-gray-900 text-sm">{p.title}</div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-gray-900">
                              {p.total_price ? `${fmt(p.total_price)} DZD` : '—'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                          <span>Expert: {p.expert_name || '—'}</span>
                          <span>·</span>
                          <span className="capitalize">{p.service_type?.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{
                              width: p.status === 'delivered' ? '100%' : p.status === 'under_review' ? '80%' : p.status === 'in_progress' ? '50%' : '10%'
                            }} />
                          </div>
                          <span className={`text-xs font-medium ${statusColor[p.status] || 'text-gray-500'}`}>
                            {p.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
          <div className="border border-indigo-100 bg-indigo-50 rounded-xl px-5 py-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 mb-2">
              <Zap size={11} /> Brief assistant
            </div>
            <div className="font-semibold text-gray-900 mb-2">Describe it in a sentence</div>
            <p className="text-xs text-gray-600 mb-3">We will scope and match a team in 24 hours.</p>
            <button onClick={() => navigate('/client/request-project')} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              <Zap size={12} /> Request project
            </button>
          </div>

          {attention.length > 0 && (
            <div className="border border-gray-200 rounded-xl px-5 py-4">
              <div className="font-semibold text-gray-900 mb-3">Needs attention</div>
              <div className="flex flex-col gap-3">
                {attention.map((a, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${a.urgent ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-900 leading-tight">{a.label}</div>
                        {a.sub && <div className="text-xs text-gray-400 mt-0.5">{a.sub}</div>}
                      </div>
                    </div>
                    <button className="text-xs px-2 py-1 bg-indigo-800 text-white rounded-lg flex-shrink-0 hover:bg-indigo-900">{a.action}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, children }) {
  return (
    <div className="border border-gray-200 rounded-xl px-5 py-4">
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">{icon} {label}</div>
      {children}
    </div>
  );
}