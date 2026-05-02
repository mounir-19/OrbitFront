import { useState, useEffect } from 'react';
import { getMyApplications, withdrawApplication } from '../../api/student.api';
import toast from 'react-hot-toast';

const statusStyle = {
  pending: 'bg-gray-100 text-gray-600',
  shortlisted: 'bg-green-50 text-green-700 border border-green-100',
  selected: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  withdrawn: 'bg-gray-50 text-gray-400',
  rejected: 'bg-red-50 text-red-600 border border-red-100',
};

const statusLabel = {
  pending: 'under review',
  shortlisted: 'shortlisted',
  selected: 'accepted',
  withdrawn: 'withdrawn',
  rejected: 'declined',
};

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);

  useEffect(() => {
    getMyApplications()
      .then((res) => setApps(res.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (id) => {
    if (!confirm('Withdraw this application?')) return;
    setWithdrawing(id);
    try {
      await withdrawApplication(id);
      setApps(a => a.map(x => x.id === id ? { ...x, status: 'withdrawn' } : x));
      toast.success('Application withdrawn.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not withdraw.');
    } finally {
      setWithdrawing(null);
    }
  };

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading applications...</div>;

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Applications</h1>
      <p className="text-sm text-gray-500 mb-8">Track where you've applied and the response from each expert.</p>

      {apps.length === 0 ? (
        <div className="border border-gray-200 rounded-xl px-5 py-10 text-center text-gray-400 text-sm">
          No applications yet. Apply to projects from the board.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1.5fr_2fr_auto] px-5 py-3 bg-gray-50 border-b border-gray-200">
            {['PROJECT', 'APPLIED', 'STATUS', 'NOTE', ''].map((h) => (
              <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>
          <div className="divide-y divide-gray-100">
            {apps.map((app) => (
              <div key={app.id} className="grid grid-cols-[2fr_1fr_1.5fr_2fr_auto] items-center px-5 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-900">{app.project_title || app.project}</span>
                <span className="text-sm text-gray-500">
                  {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </span>
                <span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[app.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel[app.status] || app.status}
                  </span>
                </span>
                <span className="text-sm text-gray-500 pr-4">{app.message || '—'}</span>
                <div className="flex gap-1.5">
                  {app.status === 'pending' && (
                    <button onClick={() => handleWithdraw(app.id)} disabled={withdrawing === app.id}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                      {withdrawing === app.id ? '...' : 'Withdraw'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}