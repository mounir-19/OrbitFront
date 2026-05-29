import { useState, useEffect } from 'react';
import { FileText, RefreshCw, Clock, User, FolderOpen, CreditCard, CheckSquare, Zap } from 'lucide-react';
import { getUsers, getAllProjects, getPayouts } from '../../api/admin.api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (str = '') =>
    str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return `${m}m ago`;
}

const ACTION_CFG = {
    user_registered: { label: 'User Registered', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: User },
    user_approved: { label: 'User Approved', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckSquare },
    user_suspended: { label: 'User Suspended', color: 'text-red-500 bg-red-50 border-red-100', icon: User },
    project_submitted: { label: 'Project Submitted', color: 'text-[#7c3aed] bg-[#f5f3ff] border-[#ede9fe]', icon: FolderOpen },
    project_assigned: { label: 'Expert Assigned', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: FolderOpen },
    payment_released: { label: 'Payment Released', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CreditCard },
    payment_pending: { label: 'Payment Pending', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: CreditCard },
    dispute_raised: { label: 'Dispute Raised', color: 'text-red-500 bg-red-50 border-red-100', icon: Zap },
};

const FILTERS = ['all', 'users', 'projects', 'payments'];

// ─── Build log entries from real data ─────────────────────────────────────────
function buildLogs(users, projects, payments) {
    const logs = [];

    users.forEach(u => {
        logs.push({
            id: `u-reg-${u.id}`,
            time: u.created_at,
            action: 'user_registered',
            actor: `${u.first_name} ${u.last_name}`,
            target: `${u.role} · ${u.email}`,
            category: 'users',
        });
        if (u.status === 'active' && u.updated_at && u.updated_at !== u.created_at) {
            logs.push({
                id: `u-appr-${u.id}`,
                time: u.updated_at,
                action: 'user_approved',
                actor: 'Admin',
                target: `${u.first_name} ${u.last_name} · ${u.role}`,
                category: 'users',
            });
        }
        if (u.status === 'suspended') {
            logs.push({
                id: `u-susp-${u.id}`,
                time: u.updated_at || u.created_at,
                action: 'user_suspended',
                actor: 'Admin',
                target: `${u.first_name} ${u.last_name} · ${u.role}`,
                category: 'users',
            });
        }
    });

    projects.forEach(p => {
        logs.push({
            id: `p-sub-${p.project_id || p.id}`,
            time: p.created_at,
            action: 'project_submitted',
            actor: p.client_name || 'Client',
            target: p.title,
            category: 'projects',
        });
        if (p.expert_name) {
            logs.push({
                id: `p-asgn-${p.project_id || p.id}`,
                time: p.updated_at || p.created_at,
                action: 'project_assigned',
                actor: 'Admin',
                target: `${p.title} → ${p.expert_name}`,
                category: 'projects',
            });
        }
    });

    payments.forEach(p => {
        logs.push({
            id: `pay-${p.id}`,
            time: p.processed_at || p.created_at,
            action: p.status === 'released' ? 'payment_released' : 'payment_pending',
            actor: 'System',
            target: `${p.project_title || '—'} · ${Number(p.amount).toLocaleString()} DZD → ${p.recipient_name || '—'}`,
            category: 'payments',
        });
    });

    return logs.sort((a, b) => new Date(b.time) - new Date(a.time));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchData = () => {
        setLoading(true);
        Promise.allSettled([
            getUsers({ role: 'expert' }),
            getUsers({ role: 'student' }),
            getUsers({ role: 'client' }),
            getAllProjects({}),
            getPayouts(),
        ]).then(([expRes, stuRes, cliRes, projRes, payRes]) => {
            const experts = expRes.status === 'fulfilled' ? expRes.value.data?.users || [] : [];
            const students = stuRes.status === 'fulfilled' ? stuRes.value.data?.users || [] : [];
            const clients = cliRes.status === 'fulfilled' ? cliRes.value.data?.users || [] : [];
            const projects = projRes.status === 'fulfilled' ? projRes.value.data || [] : [];
            const payments = payRes.status === 'fulfilled' ? payRes.value.data || [] : [];

            setLogs(buildLogs([...experts, ...students, ...clients], projects, payments));
        }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = filter === 'all' ? logs : logs.filter(l => l.category === filter);

    const counts = {
        all: logs.length,
        users: logs.filter(l => l.category === 'users').length,
        projects: logs.filter(l => l.category === 'projects').length,
        payments: logs.filter(l => l.category === 'payments').length,
    };

    const FILTER_LABELS = { all: 'All', users: 'Users', projects: 'Projects', payments: 'Payments' };

    return (
        <div className="min-h-screen bg-[#fafafa] px-8 py-8">

            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Audit Log</h1>
                    <p className="text-sm text-[#6b7280] mt-1.5">
                        {loading ? 'Loading…' : `${logs.length} events recorded`}
                    </p>
                </div>
                <button onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#ede9fe] bg-white rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest hover:bg-[#f5f3ff] transition-colors">
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Events', value: counts.all, color: 'text-[#111827]' },
                    { label: 'User Events', value: counts.users, color: 'text-blue-600' },
                    { label: 'Project Events', value: counts.projects, color: 'text-[#7c3aed]' },
                    { label: 'Payment Events', value: counts.payments, color: 'text-emerald-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-[#ede9fe] rounded-2xl px-6 py-5">
                        <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">{s.label}</div>
                        {loading
                            ? <Skeleton className="h-7 w-10" />
                            : <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        }
                    </div>
                ))}
            </div>

            {/* ── Filter pills ────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-5">
                {FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all
              ${filter === f
                                ? 'bg-[#7c3aed] text-white'
                                : 'bg-white border border-[#ede9fe] text-[#6b7280] hover:border-[#c4b5fd]'}`}>
                        {FILTER_LABELS[f]}
                        {counts[f] > 0 && (
                            <span className={`text-[10px] px-1.5 rounded-full font-bold
                ${filter === f ? 'bg-white/20 text-white' : 'bg-[#f5f3ff] text-[#7c3aed]'}`}>
                                {counts[f]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Log Table ───────────────────────────────────────────────────────── */}
            <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#f5f3ff]">
                            {['When', 'Action', 'Actor', 'Target', 'Category'].map((h, i) => (
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
                                    <td colSpan={5} className="px-6 py-4">
                                        <Skeleton className="h-8 w-full" />
                                    </td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <FileText size={24} className="text-[#ede9fe] mx-auto mb-2" />
                                    <p className="text-sm text-[#9ca3af]">No log entries.</p>
                                </td>
                            </tr>
                        ) : filtered.slice(0, 100).map(log => {
                            const cfg = ACTION_CFG[log.action] || {
                                label: log.action,
                                color: 'text-[#6b7280] bg-[#f5f3ff] border-[#ede9fe]',
                                icon: FileText,
                            };
                            const Icon = cfg.icon;
                            return (
                                <tr key={log.id} className="hover:bg-[#fafafa] transition-colors">

                                    {/* When */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-[12px] text-[#9ca3af]">
                                            <Clock size={11} />
                                            {timeAgo(log.time)}
                                        </div>
                                        <div className="text-[10px] text-[#d1d5db] mt-0.5">
                                            {new Date(log.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>

                                    {/* Action */}
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 w-fit text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${cfg.color}`}>
                                            <Icon size={9} />
                                            {cfg.label}
                                        </span>
                                    </td>

                                    {/* Actor */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[#ede9fe] flex items-center justify-center text-[10px] font-bold text-[#7c3aed] flex-shrink-0">
                                                {getInitials(log.actor)}
                                            </div>
                                            <span className="text-[13px] text-[#374151]">{log.actor}</span>
                                        </div>
                                    </td>

                                    {/* Target */}
                                    <td className="px-6 py-4">
                                        <span className="text-[13px] text-[#6b7280] truncate max-w-[260px] block">{log.target}</span>
                                    </td>

                                    {/* Category */}
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                      ${log.category === 'users' ? 'text-blue-600 bg-blue-50'
                                                : log.category === 'projects' ? 'text-[#7c3aed] bg-[#f5f3ff]'
                                                    : log.category === 'payments' ? 'text-emerald-600 bg-emerald-50'
                                                        : 'text-[#9ca3af] bg-[#f5f3ff]'}`}>
                                            {log.category}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!loading && filtered.length > 100 && (
                    <div className="px-6 py-4 border-t border-[#f5f3ff] text-center text-[11px] text-[#9ca3af]">
                        Showing 100 of {filtered.length} entries
                    </div>
                )}
            </div>
        </div>
    );
}