import { useState, useEffect } from 'react';
import {
  FileText, TrendingUp, DollarSign, ArrowUpRight,
} from 'lucide-react';
import { getMyEarnings } from '../../api/expert.api';

export function ExpertWallet() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    pending: 0, monthly: 0, earned: 0,
    lastDeposit: 0, lastDepositDate: '—',
    nextPayout: '—', growth: '+0%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyEarnings()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        const processed = data.filter(p => p.status === 'processed');
        const pending = data.filter(p => p.status === 'pending');
        const now = new Date();

        const thisMonth = processed.filter(p => {
          const d = new Date(p.processed_at || p.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = processed.filter(p => {
          const d = new Date(p.processed_at || p.created_at);
          return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
        });

        const totalEarned = processed.reduce((s, p) => s + Number(p.amount || 0), 0);
        const monthlyTotal = thisMonth.reduce((s, p) => s + Number(p.amount || 0), 0);
        const lastMonthTotal = lastMonth.reduce((s, p) => s + Number(p.amount || 0), 0);
        const pendingTotal = pending.reduce((s, p) => s + Number(p.amount || 0), 0);
        const growth = lastMonthTotal > 0
          ? (((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1)
          : '0';

        const lastPayout = [...processed].sort((a, b) =>
          new Date(b.processed_at || b.created_at) - new Date(a.processed_at || a.created_at)
        )[0];

        const nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        setSummary({
          pending: pendingTotal,
          monthly: monthlyTotal,
          earned: totalEarned,
          lastDeposit: lastPayout ? Number(lastPayout.amount) : 0,
          lastDepositDate: lastPayout
            ? new Date(lastPayout.processed_at || lastPayout.created_at)
              .toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
            : '—',
          nextPayout: nextPayoutDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          growth: `${Number(growth) >= 0 ? '+' : ''}${growth}%`,
        });
        setPayments(data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const fmtN = n => Number(n).toLocaleString('en-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading wallet...</div>;

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Overview</h1>
          <p className="text-sm text-gray-500">Track your project earnings and monthly income.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
          <FileText size={16} /> Export Statement
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-900 to-purple-700 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-10">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="white" strokeWidth="2" />
              <path d="M40 20v40M20 40h40" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-green-400/20 text-green-200 px-2 py-1 rounded-full font-medium">
                <TrendingUp size={12} /> {summary.growth}
              </div>
            </div>
            <div className="text-sm font-medium opacity-80 mb-1">Pending Balance</div>
            <div className="text-4xl font-bold mb-3">{fmtN(summary.pending)} DZD</div>
            {summary.lastDeposit > 0 && (
              <div className="flex items-center gap-1.5 text-xs opacity-70">
                <ArrowUpRight size={12} />
                Last: {fmtN(summary.lastDeposit)} DZD ({summary.lastDepositDate})
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
            <DollarSign size={20} className="text-gray-600" />
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">This Month</div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{fmtN(summary.monthly)} DZD</div>
          <div className="text-xs text-gray-500">Next payout: {summary.nextPayout}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
            <TrendingUp size={20} className="text-gray-600" />
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Total Earned</div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{fmtN(summary.earned)} DZD</div>
          <div className="text-xs text-gray-500">All time</div>
        </div>
      </div>

      {/* Payment history table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Payment History</h2>
            <p className="text-xs text-gray-500 mt-0.5">All project earnings and their status.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Project', 'Date', 'Method', 'Status', 'Amount'].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No payments yet</td>
                </tr>
              ) : payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 text-sm">{p.project_title || '—'}</div>
                    <div className="text-xs text-gray-400">{p.id?.slice(0, 8)}…</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.processed_at || p.created_at
                      ? new Date(p.processed_at || p.created_at)
                        .toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                    {(p.method || '—').replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${p.status === 'processed' ? 'bg-green-100 text-green-700' :
                      p.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        p.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {(p.status || 'pending').charAt(0).toUpperCase() + (p.status || 'pending').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 text-sm">
                    {fmtN(p.amount)} DZD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}