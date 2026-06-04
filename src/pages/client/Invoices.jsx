import { useState, useEffect } from 'react';
import { TrendingUp, FileText, AlertCircle, Download } from 'lucide-react';
import { getClientInvoices, payInvoice } from '../../api/client.api';
import toast from 'react-hot-toast';

const fmt = n => Number(n).toLocaleString('fr-DZ');

const fmtDate = iso =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS = {
    pending: { label: 'Pending', pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
    released: { label: 'Released', pill: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
    processed: { label: 'Processed', pill: 'bg-blue-50 text-blue-700', dot: 'bg-blue-400' },
    failed: { label: 'Failed', pill: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
    cancelled: { label: 'Cancelled', pill: 'bg-[#f3f4f6] text-[#6b7280]', dot: 'bg-[#9ca3af]' },
};

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

const StatCard = ({ label, value, sub, icon: Icon, loading }) => (
    <div className="bg-white rounded-2xl border border-[#ede9fe] px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
            <Icon size={17} className="text-[#7c3aed]" />
        </div>
        <div>
            <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-1">{label}</div>
            {loading
                ? <Skeleton className="h-7 w-20" />
                : <>
                    <div className="text-xl font-bold text-[#111827] leading-none">{value}</div>
                    {sub && <div className="text-[11px] text-[#9ca3af] mt-0.5">{sub}</div>}
                </>
            }
        </div>
    </div>
);

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paying, setPaying] = useState(null);

    useEffect(() => {
        getClientInvoices()
            .then(res => setInvoices(res.data || []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handlePay = async (id) => {
        setPaying(id);
        try {
            await payInvoice(id, { status: 'released' });
            setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'released' } : i));
            toast.success('Payment released!');
        } catch {
            toast.error('Payment failed. Please try again.');
        } finally {
            setPaying(null);
        }
    };

    // Derived
    const paid = invoices.filter(i => i.status === 'released').reduce((s, i) => s + Number(i.amount || 0), 0);
    const pending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount || 0), 0);
    const pendingCount = invoices.filter(i => i.status === 'pending').length;

    const stats = [
        { label: 'Paid YTD', value: `${fmt(paid)} DZD`, sub: 'Released invoices', icon: TrendingUp },
        { label: 'Pending Payment', value: `${fmt(pending)} DZD`, sub: `${pendingCount} invoice${pendingCount !== 1 ? 's' : ''} due`, icon: AlertCircle },
        { label: 'Total Invoices', value: invoices.length, sub: 'All time', icon: FileText },
        { label: 'Payment Schedule', value: 'Monthly', sub: 'Escrow-based release', icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] px-8 py-8">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Invoices</h1>
                <p className="text-sm text-[#6b7280] mt-1.5">All billing across your projects.</p>
            </div>

            {error && (
                <div className="mb-5 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle size={15} /> Failed to load invoices: {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {stats.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#ede9fe] overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_2fr_1.2fr_1.5fr_1fr_auto] px-6 py-3 bg-[#fafafa] border-b border-[#ede9fe]">
                    {['Ref', 'Project', 'Date', 'Amount', 'Status', ''].map(h => (
                        <div key={h} className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{h}</div>
                    ))}
                </div>

                {loading ? (
                    <div className="px-6 py-6 space-y-3">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-[#f5f3ff] flex items-center justify-center mb-3">
                            <FileText size={22} className="text-[#7c3aed]" />
                        </div>
                        <div className="text-sm font-semibold text-[#374151] mb-1">No invoices yet</div>
                        <div className="text-[12px] text-[#9ca3af]">Invoices appear here once your projects are billed.</div>
                    </div>
                ) : (
                    <div className="divide-y divide-[#f5f3ff]">
                        {invoices.map(inv => {
                            const st = STATUS[inv.status] || { label: inv.status, pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
                            return (
                                <div key={inv.id} className="grid grid-cols-[1fr_2fr_1.2fr_1.5fr_1fr_auto] items-center px-6 py-4 hover:bg-[#fafafa] transition-colors">
                                    <span className="text-[11px] font-mono text-[#9ca3af]">
                                        #{inv.id?.slice(0, 8).toUpperCase()}
                                    </span>
                                    <span className="text-[13px] font-semibold text-[#111827] truncate pr-4">
                                        {inv.project_title || '—'}
                                    </span>
                                    <span className="text-[12px] text-[#6b7280]">{fmtDate(inv.created_at)}</span>
                                    <span className="text-[13px] font-bold text-[#111827]">{fmt(inv.amount)} DZD</span>
                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${st.pill}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                        {st.label}
                                    </span>
                                    <div className="ml-4 flex-shrink-0">
                                        {inv.status === 'released' || inv.status === 'processed' ? (
                                            <button className="flex items-center gap-1.5 px-3 py-2 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#6b7280] hover:bg-[#f5f3ff] transition-colors">
                                                <Download size={12} /> Receipt
                                            </button>
                                        ) : inv.status === 'pending' ? (
                                            <button
                                                onClick={() => handlePay(inv.id)}
                                                disabled={paying === inv.id}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-xl text-[11px] font-bold disabled:opacity-60 hover:bg-[#6d28d9] transition-colors"
                                            >
                                                {paying === inv.id ? (
                                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : null}
                                                {paying === inv.id ? 'Paying...' : 'Pay'}
                                            </button>
                                        ) : (
                                            <div className="w-16" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}