import { useState, useEffect } from 'react';
import { getMyProjects } from '../../api/student.api';

export default function MyProjects() {
  const [active, setActive] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProjects()
      .then((res) => {
        const projects = res.data || [];
        setActive(projects.filter(p => ['in_progress', 'in_review', 'accepted'].includes(p.status)));
        setCompleted(projects.filter(p => p.status === 'delivered'));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading projects...</div>;

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My projects</h1>
      <p className="text-sm text-gray-500 mb-8">Active assignments where you're a contributor.</p>

      {active.length === 0 ? (
        <div className="border border-gray-200 rounded-xl px-5 py-10 text-center text-gray-400 text-sm mb-6">
          No active projects yet. Apply from the project board.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
          {active.map((p, i) => (
            <div key={p.project_id || p.id}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${i !== active.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {(p.title || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm mb-1">{p.title}</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                  <span className="font-medium text-indigo-600">{p.service_type}</span>
                  <span>·</span>
                  <span>Expert: {p.expert_name || '—'}</span>
                  <span>·</span>
                  <span className="capitalize">{p.status?.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className="w-28 flex-shrink-0">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full"
                    style={{ width: p.status === 'in_review' ? '80%' : p.status === 'in_progress' ? '50%' : '20%' }} />
                </div>
              </div>
              <button className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
                Open workspace
              </button>
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-900">Completed (recent)</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {completed.map((p) => (
              <div key={p.project_id || p.id} className="bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="font-medium text-sm text-gray-900 mb-1">{p.title}</div>
                <div className="text-xs text-gray-500">
                  {p.delivered_at ? `Completed ${new Date(p.delivered_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : 'Completed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}