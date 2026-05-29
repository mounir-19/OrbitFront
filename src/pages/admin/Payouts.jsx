import { useState, useEffect } from 'react';
import {
  FileText, TrendingUp, DollarSign, ArrowUpRight,
  CheckCircle, Clock, Loader2, CreditCard, Users,
} from 'lucide-react';
import { getPayouts, updatePayment } from '../../api/admin.api';
import toast from 'react-hot-toast';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

const fmtN = n =>
  Number(n).toLocaleString('en-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Payouts() {
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({
    pending: 0, released: 0, fee: 0,
    total: 0, lastRelease: 0, lastReleaseDate: '—',
    growth: '+0%',
  });
  const [approving, setApproving] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getPayouts()
      .then(res => {
        const data = res.data || [];
        setPayouts(data);

        const now = new Date();
        const released = data.filter(p => p.status === 'released');
        const pending = data.filter(p => p.status === 'pending');

        const thisMonth = released.filter(p => {
          const d = new Date(p.processed_at || p.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = released.filter(p => {
          const d = new Date(p.processed_at || p.created_at);
          return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
        });

        const releasedTotal = released.reduce((s, p) => s + Number(p.amount), 0);
        const pendingTotal = pending.reduce((s, p) => s + Number(p.amount), 0);
        const thisMonthTotal = thisMonth.reduce((s, p) => s + Number(p.amount), 0);
        const lastMonthTotal = lastMonth.reduce((s, p) => s + Number(p.amount), 0);
        const growth = lastMonthTotal > 0
          ? (((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1)
          : '0';

        const lastPayout = [...released].sort((a, b) =>
          new Date(b.processed_at || b.created_at) - new Date(a.processed_at || a.created_at)
        )[0];

        setSummary({
          pending: pendingTotal,
          released: releasedTotal,
          fee: releasedTotal * 0.40, // org's 40% share
          total: data.length,
          lastRelease: lastPayout ? Number(lastPayout.amount) : 0,
          lastReleaseDate: lastPayout
            ? new Date(lastPayout.processed_at || lastPayout.created_at)
              .toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
            : '—',
          growth: `${Number(growth) >= 0 ? '+' : ''}${growth}%`,
        });
      })
      .catch(() => toast.error('Failed to load payouts'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await updatePayment(id, { status: 'released', processed_at: new Date().toISOString() });
      setPayouts(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'released', processed_at: new Date().toISOString() } : p
      ));
      setSummary(s => {
        const payout = payouts.find(p => p.id === id);
        const amt = payout ? Number(payout.amount) : 0;
        return {
          ...s,
          pending: Math.max(0, s.pending - amt),
          released: s.released + amt,
          fee: (s.released + amt) * 0.40,
        };
      });
      toast.success('Payment released!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to release');
    } finally { setApproving(null); }
  };

  const filtered = filter === 'all' ? payouts : payouts.filter(p => p.status === filter);

  const FILTERS = [
    { key: 'all', label: 'All', count: payouts.length },
    { key: 'pending', label: 'Pending', count: payouts.filter(p => p.status === 'pending').length },
    { key: 'released', label: 'Released', count: payouts.filter(p => p.status === 'released').length },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Payouts</h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            {loading ? 'Loading…' : `${payouts.filter(p => p.status === 'pending').length} pending release · ${payouts.length} total`}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-[#ede9fe] bg-white rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest hover:bg-[#f5f3ff] transition-colors">
          <FileText size={13} /> Export Statement
        </button>
      </div>

      {/* ── Balance Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">

        {/* Pending — dark hero card */}
        <div className="bg-[#1e1b4b] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#7c3aed]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Clock size={18} className="text-white" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] bg-amber-400/20 text-amber-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
                <Clock size={10} /> Awaiting
              </div>
            </div>
            <div className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-1">Pending Release</div>
            {loading
              ? <Skeleton className="h-10 w-40 bg-white/10" />
              : <div className="text-4xl font-bold mb-3">{fmtN(summary.pending)} <span className="text-xl font-normal opacity-60">DZD</span></div>
            }
            {summary.lastRelease > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] opacity-60">
                <ArrowUpRight size={11} />
                Last release: {fmtN(summary.lastRelease)} DZD ({summary.lastReleaseDate})
              </div>
            )}
          </div>
        </div>

        {/* Released */}
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center mb-4">
            <CheckCircle size={18} className="text-[#7c3aed]" />
          </div>
          <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Total Released</div>
          {loading
            ? <Skeleton className="h-9 w-36 mb-2" />
            : <div className="text-3xl font-bold text-[#111827] mb-2">{fmtN(summary.released)} <span className="text-base font-normal text-[#9ca3af]">DZD</span></div>
          }
          <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
            <TrendingUp size={11} className="text-emerald-500" />
            <span className="text-emerald-600 font-semibold">{summary.growth}</span> vs last month
          </div>
        </div>

        {/* Org share */}
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center mb-4">
            <DollarSign size={18} className="text-[#7c3aed]" />
          </div>
          <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Organisation Share (40%)</div>
          {loading
            ? <Skeleton className="h-9 w-36 mb-2" />
            : <div className="text-3xl font-bold text-[#111827] mb-2">{fmtN(summary.fee)} <span className="text-base font-normal text-[#9ca3af]">DZD</span></div>
          }
          <div className="text-[11px] text-[#9ca3af]">From {summary.total} total payments</div>
        </div>
      </div>

      {/* ── Filter pills ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-5">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all
              ${filter === f.key
                ? 'bg-[#7c3aed] text-white'
                : 'bg-white border border-[#ede9fe] text-[#6b7280] hover:border-[#c4b5fd]'}`}>
            {f.label}
            {f.count > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full font-bold
                ${filter === f.key ? 'bg-white/20 text-white' : 'bg-[#f5f3ff] text-[#7c3aed]'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f5f3ff] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#111827]">Payment History</h2>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">All disbursements to experts and students.</p>
          </div>
          {!loading && (
            <span className="text-[11px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2.5 py-1 rounded-full">
              {filtered.length} records
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f5f3ff]">
                {['Project', 'Recipient', 'Method', 'Date', 'Status', 'Amount', ''].map((h, i) => (
                  <th key={h + i}
                    className={`px-6 py-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest bg-[#fafafa]
                      ${i === 5 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f3ff]">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#9ca3af]">
                    No {filter === 'all' ? '' : filter} payments yet.
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-[13px] font-semibold text-[#111827] truncate max-w-[160px]">
                      {p.project_title || '—'}
                    </div>
                    <div className="text-[10px] text-[#9ca3af] font-mono">{p.id?.slice(0, 8)}…</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#ede9fe] flex items-center justify-center text-[10px] font-bold text-[#7c3aed] flex-shrink-0">
                        {p.recipient_name ? p.recipient_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??'}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[#374151]">{p.recipient_name || '—'}</div>
                        <div className="text-[10px] text-[#9ca3af] capitalize">{p.recipient_type || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#6b7280] capitalize">
                    {(p.method || '—').replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#6b7280]">
                    {p.processed_at || p.created_at
                      ? new Date(p.processed_at || p.created_at)
                        .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 w-fit text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
                      ${p.status === 'released' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : p.status === 'pending' ? 'text-amber-600 bg-amber-50 border border-amber-100'
                          : p.status === 'failed' ? 'text-red-600 bg-red-50 border border-red-100'
                            : 'text-[#9ca3af] bg-[#f5f3ff] border border-[#ede9fe]'}`}>
                      {p.status === 'released' && <CheckCircle size={9} />}
                      {p.status === 'pending' && <Clock size={9} />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#111827] text-[13px]">
                    {fmtN(p.amount)} DZD
                  </td>
                  <td className="px-6 py-4">
                    {p.status === 'pending' && (
                      <button onClick={() => handleApprove(p.id)} disabled={approving === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 transition-colors">
                        {approving === p.id
                          ? <Loader2 size={11} className="animate-spin" />
                          : <CheckCircle size={11} />}
                        {approving === p.id ? '…' : 'Release'}
                      </button>
                    )}
                    {p.status === 'released' && (
                      <span className="text-[11px] text-[#9ca3af]">
                        {p.processed_at
                          ? new Date(p.processed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : 'Released'}
                      </span>
                    )}
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