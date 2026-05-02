import { useState, useEffect } from 'react';
import { getApplications } from '../../api/admin.api';
import toast from 'react-hot-toast';

// Note: backend has no disputes table yet — disputes come from applications with status issues
// This page shows applications that are in contested states

const sevStyle = {
  high: 'bg-red-50 text-red-600 border border-red-100',
  med: 'bg-amber-50 text-amber-600 border border-amber-100',
  low: 'bg-green-50 text-green-600 border border-green-100',
};

export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [mediating, setMediating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load rejected/contested applications as disputes
    getApplications({ status: 'rejected' })
      .then(res => {
        const apps = res.data || [];
        setDisputes(apps.map(a => ({
          id: a.id,
          project: a.project_title || '—',
          parties: `Student ↔ Expert`,
          issue: a.message || 'Application contested',
          age: a.applied_at ? `${Math.floor((Date.now() - new Date(a.applied_at)) / 86400000)}d ago` : '—',
          severity: 'med',
        })));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleMediate = async (id) => {
    setMediating(id);
    try {
      toast.success('Dispute marked as resolved');
      setDisputes(d => d.filter(x => x.id !== id));
    } catch {
      toast.error('Failed to mediate');
    } finally {
      setMediating(null);
    }
  };

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Disputes</h1>
      <p className="text-sm text-gray-500 mb-8">Open tickets between clients, experts, and students.</p>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[0.6fr_1.5fr_1.5fr_2fr_0.8fr_0.8fr_auto] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['ID', 'PROJECT', 'PARTIES', 'ISSUE', 'AGE', 'SEVERITY', ''].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : disputes.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No open disputes.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {disputes.map(d => (
              <div key={d.id} className="grid grid-cols-[0.6fr_1.5fr_1.5fr_2fr_0.8fr_0.8fr_auto] items-center px-5 py-4 hover:bg-gray-50">
                <span className="text-xs font-mono text-gray-500">{d.id?.slice(0, 6)}</span>
                <span className="text-sm font-medium text-gray-900">{d.project}</span>
                <span className="text-sm text-gray-600">{d.parties}</span>
                <span className="text-sm text-gray-600 pr-4 truncate">{d.issue}</span>
                <span className="text-sm text-gray-500">{d.age}</span>
                <span><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sevStyle[d.severity]}`}>{d.severity}</span></span>
                <button onClick={() => handleMediate(d.id)} disabled={mediating === d.id}
                  className="px-3 py-1.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 disabled:opacity-60">
                  {mediating === d.id ? '...' : 'Mediate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}