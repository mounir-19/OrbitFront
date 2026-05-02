import { useState, useEffect } from 'react';
import { getEarnings } from '../../api/student.api';
import { getMe } from '../../api/auth.api';

const statusStyle = {
  released: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-600',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function Earnings() {
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({ total: 0, thisMonth: 0, pending: 0, method: 'CCP' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEarnings()
      .then((res) => {
        const data = res.data || [];
        const released = data.filter(p => p.status === 'released');
        const pending = data.filter(p => p.status === 'pending');
        const now = new Date();
        const thisMonth = released.filter(p => {
          const d = new Date(p.processed_at || p.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        setSummary({
          total: released.reduce((s, p) => s + Number(p.amount), 0),
          thisMonth: thisMonth.reduce((s, p) => s + Number(p.amount), 0),
          pending: pending.reduce((s, p) => s + Number(p.amount), 0),
          method: data[0]?.method || 'CCP',
        });
        setPayouts(data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n).toLocaleString('fr-DZ');

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading earnings...</div>;

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Earnings</h1>
      <p className="text-sm text-gray-500 mb-8">Payouts, tax docs, and payment preferences.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="text-sm text-gray-500 mb-1">Total earned</div>
          <div className="text-xl font-bold text-gray-900">{fmt(summary.total)} DZD</div>
        </div>
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="text-sm text-gray-500 mb-1">This month</div>
          <div className="text-xl font-bold text-gray-900">{fmt(summary.thisMonth)} DZD</div>
        </div>
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="text-sm text-gray-500 mb-1">Pending release</div>
          <div className="text-xl font-bold text-gray-900">{fmt(summary.pending)} DZD</div>
        </div>
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="text-sm text-gray-500 mb-1">Payout method</div>
          <div className="text-xl font-bold text-gray-900">{summary.method}</div>
        </div>
      </div>

      {payouts.length === 0 ? (
        <div className="border border-gray-200 rounded-xl px-5 py-10 text-center text-gray-400 text-sm">
          No payouts yet.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1.2fr_2fr_1fr_1.5fr_1fr] px-5 py-3 bg-gray-50 border-b border-gray-200">
            {['REF', 'PROJECT', 'DATE', 'AMOUNT', 'STATUS'].map((h) => (
              <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>
          <div className="divide-y divide-gray-100">
            {payouts.map((p) => (
              <div key={p.id} className="grid grid-cols-[1.2fr_2fr_1fr_1.5fr_1fr] items-center px-5 py-4 hover:bg-gray-50">
                <span className="text-sm text-gray-500 font-mono">{p.id?.slice(0, 8)}</span>
                <span className="text-sm font-medium text-gray-900">{p.project_title || '—'}</span>
                <span className="text-sm text-gray-500">
                  {p.processed_at ? new Date(p.processed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </span>
                <span className="text-sm font-semibold text-gray-900">{fmt(p.amount)} DZD</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[p.status] || 'bg-gray-100 text-gray-600'}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}