import { useState, useEffect } from 'react';
import { FolderOpen, ChevronRight, TrendingUp } from 'lucide-react';
import { getAllProjects } from '../../api/admin.api';
import { useNavigate } from 'react-router-dom';

const STATUS_TABS = [
  { label: 'All', value: null },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Delivered', value: 'delivered' },
];

const STATUS_CFG = {
  in_progress: { label: 'In Progress', dot: 'bg-blue-400', text: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  under_review: { label: 'Under Review', dot: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  delivered: { label: 'Delivered', dot: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  accepted: { label: 'Accepted', dot: 'bg-[#7c3aed]', text: 'text-[#7c3aed]', bg: 'bg-[#f5f3ff] border-[#ede9fe]' },
  submitted: { label: 'Submitted', dot: 'bg-[#d1d5db]', text: 'text-[#9ca3af]', bg: 'bg-[#f5f3ff] border-[#ede9fe]' },
  rejected: { label: 'Rejected', dot: 'bg-red-400', text: 'text-red-500', bg: 'bg-red-50 border-red-100' },
  cancelled: { label: 'Cancelled', dot: 'bg-[#d1d5db]', text: 'text-[#9ca3af]', bg: 'bg-[#f5f3ff] border-[#ede9fe]' },
};

const getInitials = (str = '') =>
  str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

export default function AllProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllProjects({})
      .then(res => {
        const data = res.data || [];
        setAllProjects(data);
        setProjects(data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleTabChange = (i) => {
    setActiveTab(i);
    const status = STATUS_TABS[i].value;
    setProjects(status ? allProjects.filter(p => p.status === status) : allProjects);
  };

  const counts = {};
  allProjects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });

  const tabCount = (t, i) => i === 0 ? allProjects.length : counts[t.value] || 0;

  const STAT_CARDS = [
    { label: 'Total Projects', value: allProjects.length, color: 'text-[#111827]' },
    { label: 'In Progress', value: counts['in_progress'] || 0, color: 'text-blue-600' },
    { label: 'Delivered', value: counts['delivered'] || 0, color: 'text-emerald-600' },
    { label: 'Submitted', value: counts['submitted'] || 0, color: 'text-[#9ca3af]' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">All Projects</h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            {loading ? 'Loading…' : `${allProjects.length} projects · ${counts['in_progress'] || 0} in progress`}
          </p>
        </div>

        {/* Hero counter */}
        {!loading && (
          <div className="flex items-center gap-4 bg-[#f5f3ff] border border-[#ede9fe] rounded-2xl px-6 py-4">
            <div className="w-12 h-12 rounded-xl bg-[#ede9fe] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#7c3aed]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest mb-0.5">Active Portfolio</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#111827]">{counts['in_progress'] || 0}</span>
                <span className="text-sm text-[#9ca3af]">in progress</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-white border border-[#ede9fe] rounded-2xl px-6 py-5">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">{s.label}</div>
            {loading
              ? <Skeleton className="h-7 w-10" />
              : <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            }
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 border-b border-[#f5f3ff] mb-5">
        {STATUS_TABS.map((t, i) => (
          <button key={t.label} onClick={() => handleTabChange(i)}
            className={`relative flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors
              ${activeTab === i ? 'text-[#7c3aed]' : 'text-[#9ca3af] hover:text-[#6b7280]'}`}>
            {t.label}
            {tabCount(t, i) > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                ${activeTab === i ? 'bg-[#7c3aed] text-white' : 'bg-[#f5f3ff] text-[#7c3aed]'}`}>
                {tabCount(t, i)}
              </span>
            )}
            {activeTab === i && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#7c3aed] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f3ff]">
              {['Project', 'Client', 'Expert', 'Team', 'Budget', 'Status', ''].map((h, i) => (
                <th key={h + i}
                  className="px-6 py-4 text-left text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest bg-[#fafafa]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f3ff]">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  <td colSpan={7} className="px-6 py-4">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <FolderOpen size={28} className="text-[#ede9fe] mx-auto mb-3" />
                  <p className="text-sm text-[#9ca3af]">No projects found.</p>
                </td>
              </tr>
            ) : projects.map(p => {
              const cfg = STATUS_CFG[p.status] || STATUS_CFG.submitted;
              const pid = p.project_id || p.id;
              return (
                <tr key={pid}
                  onClick={() => navigate(`/admin/projects/${pid}`)}
                  className="hover:bg-[#fafafa] transition-colors cursor-pointer group">

                  {/* Project */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#ede9fe] flex items-center justify-center text-[12px] font-bold text-[#7c3aed] flex-shrink-0">
                        {getInitials(p.title)}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#111827] leading-tight">{p.title}</div>
                        <div className="text-[11px] text-[#9ca3af] capitalize mt-0.5">
                          {p.service_type?.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-[#6b7280]">{p.client_name || '—'}</span>
                  </td>

                  {/* Expert */}
                  <td className="px-6 py-4">
                    {p.expert_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#ede9fe] flex items-center justify-center text-[10px] font-bold text-[#7c3aed] flex-shrink-0">
                          {getInitials(p.expert_name)}
                        </div>
                        <span className="text-[13px] text-[#374151]">{p.expert_name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-[#9ca3af] bg-[#f5f3ff] border border-[#ede9fe] px-2 py-1 rounded-full uppercase tracking-wide">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Team */}
                  <td className="px-6 py-4">
                    {p.team_size ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                          {Array.from({ length: Math.min(p.team_size, 3) }).map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-[#ede9fe] border-2 border-white flex items-center justify-center text-[8px] font-bold text-[#7c3aed]">
                              {i + 1}
                            </div>
                          ))}
                        </div>
                        {p.team_size > 3 && (
                          <span className="text-[11px] text-[#9ca3af]">+{p.team_size - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#9ca3af]">—</span>
                    )}
                  </td>

                  {/* Budget */}
                  <td className="px-6 py-4">
                    <span className="text-[13px] font-semibold text-[#111827]">
                      {p.total_price ? `${Number(p.total_price).toLocaleString()} DZD` : '—'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 w-fit text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${cfg.text} ${cfg.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Arrow */}
                  <td className="px-4 py-4">
                    <ChevronRight size={15} className="text-[#d1d5db] group-hover:text-[#7c3aed] transition-colors" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}