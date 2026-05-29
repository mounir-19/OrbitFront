import { useState, useEffect } from 'react';
import { getEarnings } from '../../api/student.api';
import { Download, TrendingUp, DollarSign, ArrowUpRight, Filter } from 'lucide-react';

export default function Earnings() {
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    monthly: 0,
    earned: 0,
    lastDeposit: 0,
    lastDepositDate: '—',
    nextPayout: '—',
    growth: '+0%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEarnings()
      .then((res) => {
        const data = res.data || [];
        // DB uses 'processed' not 'released'
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

        // Last processed payout
        const lastPayout = processed.sort((a, b) =>
          new Date(b.processed_at || b.created_at) - new Date(a.processed_at || a.created_at)
        )[0];

        // Next payout: first of next month
        const nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextPayout = nextPayoutDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        setSummary({
          total: pendingTotal,
          monthly: monthlyTotal,
          earned: totalEarned,
          lastDeposit: lastPayout ? Number(lastPayout.amount) : 0,
          lastDepositDate: lastPayout
            ? new Date(lastPayout.processed_at || lastPayout.created_at)
              .toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
            : '—',
          nextPayout,
          growth: `${Number(growth) >= 0 ? '+' : ''}${growth}%`,
        });

        setPayouts(data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n).toLocaleString('en-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading wallet...</div>;

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Overview</h1>
          <p className="text-sm text-gray-500">Track your project earnings and monthly income.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white">
            <Download size={16} />
            Export Statement
          </button>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Pending balance */}
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
                <TrendingUp size={12} />
                {summary.growth}
              </div>
            </div>
            <div className="text-sm font-medium opacity-80 mb-1">Pending Balance</div>
            <div className="text-4xl font-bold mb-3">{fmt(summary.total)} DZD</div>
            {summary.lastDeposit > 0 && (
              <div className="flex items-center gap-1.5 text-xs opacity-70">
                <ArrowUpRight size={12} />
                Last: {fmt(summary.lastDeposit)} DZD ({summary.lastDepositDate})
              </div>
            )}
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <DollarSign size={20} className="text-gray-600" />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">This Month</div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{fmt(summary.monthly)} DZD</div>
          <div className="text-xs text-gray-500">
            Next payout: {summary.nextPayout}
          </div>
        </div>

        {/* Total earned */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-gray-600" />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Total Earned</div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{fmt(summary.earned)} DZD</div>
          <div className="text-xs text-gray-500">All time</div>
        </div>
      </div>

      {/* Payouts table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Payment History</h2>
            <p className="text-xs text-gray-500 mt-0.5">All project earnings and their status.</p>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <Filter size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-400">No payments yet</td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 text-sm">{payout.project_title || '—'}</div>
                      <div className="text-xs text-gray-400">{payout.id?.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payout.processed_at || payout.created_at
                        ? new Date(payout.processed_at || payout.created_at)
                          .toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {(payout.method || '—').replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${payout.status === 'processed' ? 'bg-green-100 text-green-700' :
                        payout.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          payout.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {(payout.status || 'pending').charAt(0).toUpperCase() + (payout.status || 'pending').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {fmt(payout.amount)} DZD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}