import { useState, useEffect } from 'react';
import { getPayouts, updatePayment } from '../../api/admin.api';
import toast from 'react-hot-toast';

const statusStyle = {
  pending: 'bg-amber-50 text-amber-600',
  released: 'bg-green-50 text-green-700',
};

export default function Payouts() {
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, released: 0, fee: 0 });
  const [approving, setApproving] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayouts()
      .then(res => {
        const data = res.data || [];
        setPayouts(data);
        const pending = data.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
        const released = data.filter(p => p.status === 'released').reduce((s, p) => s + Number(p.amount), 0);
        setSummary({ pending, released, fee: released * 0.05 });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await updatePayment(id, { status: 'released', processed_at: new Date().toISOString() });
      setPayouts(p => p.map(x => x.id === id ? { ...x, status: 'released' } : x));
      toast.success('Payment released!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to release');
    } finally {
      setApproving(null);
    }
  };

  const fmt = (n) => Number(n).toLocaleString('fr-DZ');

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Payouts</h1>
      <p className="text-sm text-gray-500 mb-8">Batched payments to experts and students.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending approval', value: `${fmt(summary.pending)} DZD` },
          { label: 'Released this month', value: `${fmt(summary.released)} DZD` },
          { label: 'Platform fee (5%)', value: `${fmt(summary.fee)} DZD` },
          { label: 'Total payments', value: payouts.length },
        ].map(s => (
          <div key={s.label} className="border border-gray-200 rounded-xl px-5 py-4">
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_auto] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['REF', 'PROJECT', 'RECIPIENT', 'AMOUNT', 'DATE', 'STATUS'].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : payouts.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No payments yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payouts.map(p => (
              <div key={p.id} className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_auto] items-center px-5 py-4 hover:bg-gray-50 gap-2">
                <span className="text-xs font-mono text-gray-500">{p.id?.slice(0, 8)}</span>
                <span className="text-sm font-medium text-gray-900">{p.project_title || '—'}</span>
                <span className="text-sm text-gray-600">{p.recipient_name || '—'}</span>
                <span className="text-sm font-semibold text-gray-900">{fmt(p.amount)} DZD</span>
                <span className="text-sm text-gray-500">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[p.status] || 'bg-gray-100 text-gray-600'}`}>
                    {p.status}
                  </span>
                  {p.status === 'pending' && (
                    <button onClick={() => handleApprove(p.id)} disabled={approving === p.id}
                      className="px-3 py-1.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 disabled:opacity-60">
                      {approving === p.id ? '...' : 'Approve'}
                    </button>
                  )}
                  {p.status === 'released' && (
                    <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Details</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}