import { useState, useEffect } from 'react';
import { Filter, Download } from 'lucide-react';
import { getAllProjects } from '../../api/admin.api';

const STATUS_TABS = [
  { label: 'All', value: null },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Under review', value: 'under_review' },
  { label: 'Awaiting payment', value: 'delivered' },
  { label: 'Accepted', value: 'accepted' },
];

const statusStyle = {
  in_progress: 'bg-blue-50 text-blue-700',
  under_review: 'bg-amber-50 text-amber-600',
  delivered: 'bg-green-50 text-green-700',
  accepted: 'bg-indigo-50 text-indigo-700',
  pending: 'bg-gray-100 text-gray-600',
};

export default function AllProjects() {
  const [projects, setProjects] = useState([]);
  const [counts, setCounts] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProjects = (status) => {
    setLoading(true);
    getAllProjects(status ? { status } : {})
      .then(res => {
        const data = res.data || [];
        setProjects(data);
        // count per status for tab labels
        if (!status) {
          const c = {};
          data.forEach(p => { c[p.status] = (c[p.status] || 0) + 1; });
          setCounts(c);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(null); }, []);

  const handleTabChange = (i) => {
    setActiveTab(i);
    fetchProjects(STATUS_TABS[i].value);
  };

  const tabLabel = (t, i) => {
    if (i === 0) return `All (${projects.length || 0})`;
    const v = t.value;
    return `${t.label} (${counts[v] || 0})`;
  };

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All projects</h1>
          <p className="text-sm text-gray-500 mt-1">Every project from every client — filter, flag, or intervene.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Filter size={14} /> Filter</button>
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Download size={14} /> Export</button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 mt-4">
        {STATUS_TABS.map((t, i) => (
          <button key={t.label} onClick={() => handleTabChange(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === i ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tabLabel(t, i)}
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['PROJECT', 'CLIENT', 'EXPERT', 'TEAM', 'BUDGET', 'STATUS'].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No projects found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {projects.map(p => {
              const expertInit = p.expert_name ? p.expert_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '—';
              return (
                <div key={p.project_id || p.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr] items-center px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.title}</div>
                    <div className="text-xs text-gray-400 capitalize">{p.service_type?.replace(/_/g, ' ')}</div>
                  </div>
                  <span className="text-sm text-gray-600">{p.client_name || '—'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-semibold text-indigo-600">{expertInit}</div>
                    <span className="text-sm text-gray-600">{p.expert_name || 'Unassigned'}</span>
                  </div>
                  <span className="text-sm text-gray-600">{p.team_size || '—'}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {p.total_price ? `${Number(p.total_price).toLocaleString()} DZD` : '—'}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${statusStyle[p.status] || 'bg-gray-100 text-gray-600'}`}>
                    {p.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}