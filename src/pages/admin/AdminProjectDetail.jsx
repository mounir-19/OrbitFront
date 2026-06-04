import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Zap, CheckCircle, Clock, AlertCircle,
    ChevronRight, MessageCircle, User, CreditCard, RefreshCw, X,
} from 'lucide-react';
import {
    getProject, getPayouts, getPaymentBreakdown,
    getApplications, updatePayment, createPayment,
    confirmAndStart,
} from '../../api/admin.api';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => Number(n).toLocaleString('fr-DZ');
const fmtDate = iso =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const getInitials = (str = '') =>
    str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const STATUS_CONFIG = {
    submitted: { label: 'Submitted', pill: 'bg-[#f3f4f6] text-[#6b7280]', dot: 'bg-[#9ca3af]' },
    under_review: { label: 'Under Review', pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
    accepted: { label: 'Accepted', pill: 'bg-blue-50 text-blue-700', dot: 'bg-blue-400' },
    in_progress: { label: 'In Progress', pill: 'bg-[#f5f3ff] text-[#7c3aed]', dot: 'bg-[#7c3aed]' },
    in_review: { label: 'In Review', pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
    delivered: { label: 'Delivered', pill: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
    rejected: { label: 'Rejected', pill: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
    cancelled: { label: 'Cancelled', pill: 'bg-[#f3f4f6] text-[#6b7280]', dot: 'bg-[#9ca3af]' },
};

const TASK_STATUS = {
    open: { label: 'Open', icon: Clock, color: 'text-[#9ca3af]', bg: 'bg-[#f3f4f6]' },
    in_progress: { label: 'In Progress', icon: Zap, color: 'text-[#7c3aed]', bg: 'bg-[#f5f3ff]' },
    in_review: { label: 'In Review', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    blocked: { label: 'Blocked', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

const PAYMENT_STATUS_CFG = {
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700' },
    client_paid: { label: 'Client Paid', cls: 'bg-blue-50 text-blue-700' },
    processed: { label: 'Processed', cls: 'bg-[#f5f3ff] text-[#7c3aed]' },
    released: { label: 'Released', cls: 'bg-green-50 text-green-700' },
    failed: { label: 'Failed', cls: 'bg-red-50 text-red-600' },
    refunded: { label: 'Refunded', cls: 'bg-[#f3f4f6] text-[#6b7280]' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, children, loading }) => (
    <div className="bg-white rounded-2xl border border-[#ede9fe] px-5 py-4">
        <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">{label}</div>
        {loading ? <Skeleton className="h-8 w-20" /> : children}
    </div>
);

// ─── Create Invoice Modal ─────────────────────────────────────────────────────
function CreateInvoiceModal({ project, team, onClose, onCreated }) {
    const [recipientId, setRecipientId] = useState('');
    const [recipientType, setRecipientType] = useState('expert');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bank_transfer');
    const [ref, setRef] = useState('');
    const [saving, setSaving] = useState(false);

    const members = team.filter(m =>
        recipientType === 'expert' ? m.role === 'expert' : m.role === 'student'
    );

    const handleCreate = async () => {
        if (!recipientId) { toast.error('Select a recipient.'); return; }
        if (!amount || isNaN(amount)) { toast.error('Enter a valid amount.'); return; }
        setSaving(true);
        try {
            await createPayment({
                project_id: project.project_id || project.id,
                recipient_id: recipientId,
                recipient_type: recipientType,
                amount: Number(amount),
                method,
                transaction_ref: ref || null,
            });
            toast.success('Invoice created.');
            onCreated();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to create invoice.');
        } finally { setSaving(false); }
    };

    const L = ({ children }) => (
        <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-widest mb-2">{children}</label>
    );
    const S = ({ className = '', ...props }) => (
        <select {...props} className={`w-full bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 text-[14px] text-[#111827]
      outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#f5f3ff] transition-all ${className}`} />
    );
    const I = ({ className = '', ...props }) => (
        <input {...props} className={`w-full bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 text-[14px] text-[#111827]
      outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#f5f3ff] transition-all placeholder:text-[#d1d5db] ${className}`} />
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl border border-[#ede9fe] w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f3ff]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
                            <CreditCard size={14} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-[#111827]">Create Invoice</h2>
                            <p className="text-[11px] text-[#9ca3af] truncate max-w-xs">{project?.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#f5f3ff]">
                        <X size={16} className="text-[#9ca3af]" />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <L>Recipient Type</L>
                        <S value={recipientType} onChange={e => { setRecipientType(e.target.value); setRecipientId(''); }}>
                            <option value="expert">Expert</option>
                            <option value="student">Student</option>
                        </S>
                    </div>
                    <div>
                        <L>Recipient</L>
                        <S value={recipientId} onChange={e => setRecipientId(e.target.value)}>
                            <option value="">Select recipient</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </S>
                    </div>
                    <div>
                        <L>Amount (DZD)</L>
                        <I value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 15000" inputMode="numeric" />
                    </div>
                    <div>
                        <L>Method</L>
                        <S value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cib">CIB</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                        </S>
                    </div>
                    <div>
                        <L>Transaction Ref (optional)</L>
                        <I value={ref} onChange={e => setRef(e.target.value)} placeholder="e.g. TXN-20240601" />
                    </div>
                    <button onClick={handleCreate} disabled={saving}
                        className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                        {saving && <RefreshCw size={12} className="animate-spin" />}
                        {saving ? 'Creating…' : 'Create Invoice'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [team, setTeam] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [updatingPayment, setUpdatingPayment] = useState(null);

    const loadData = () => {
        setLoading(true);
        Promise.allSettled([
            getProject(id),
            api.get(`/tasks`, { params: { project_id: id } }),
            api.get(`/projects/${id}/team`),
            getPayouts({ project_id: id }),
        ]).then(([projRes, tasksRes, teamRes, payRes]) => {
            if (projRes.status === 'fulfilled') {
                setProject(projRes.value.data);
            } else {
                setError('Project not found.');
            }
            if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data || []);
            if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data || []);
            if (payRes.status === 'fulfilled') setPayments(payRes.value.data || []);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, [id]);

    // ── Derived ────────────────────────────────────────────────────────────────
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const st = STATUS_CONFIG[project?.status] || { label: project?.status, pill: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
    const expertsOnTeam = team.filter(m => m.role === 'expert');
    const studentsOnTeam = team.filter(m => m.role === 'student');

    // Payment intent received but project not yet started
    const hasPaymentIntent = payments.some(p => p.status === 'pending' || p.status === 'client_paid');
    const showConfirmStart = !loading && project?.status === 'accepted' && hasPaymentIntent;

    // ── Confirm & Start ────────────────────────────────────────────────────────
    const handleConfirmStart = async () => {
        setConfirming(true);
        try {
            await confirmAndStart(project.project_id || project.id);
            toast.success('Project started! Expert and team have been notified.');
            loadData();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to start project.');
        } finally { setConfirming(false); }
    };

    // ── Update payment status ──────────────────────────────────────────────────
    const handleUpdatePayment = async (paymentId, status) => {
        setUpdatingPayment(paymentId);
        try {
            await updatePayment(paymentId, { status });
            toast.success(`Payment marked as ${status}.`);
            loadData();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to update payment.');
        } finally { setUpdatingPayment(null); }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-[#fafafa] px-8 py-8 flex flex-col items-center justify-center">
                <div className="text-sm text-red-500 mb-4">{error}</div>
                <button onClick={() => navigate('/admin/projects')} className="text-[#7c3aed] text-sm font-bold">
                    ← Back to projects
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] px-8 py-8">

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/admin/projects')}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest hover:text-[#7c3aed] transition-colors"
                >
                    <ArrowLeft size={13} /> Back to projects
                </button>
                <div className="flex gap-2">
                    {showConfirmStart && (
                        <button
                            onClick={handleConfirmStart}
                            disabled={confirming}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#7c3aed] text-white rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-[#6d28d9] transition-colors disabled:opacity-60"
                        >
                            {confirming
                                ? <RefreshCw size={13} className="animate-spin" />
                                : <Zap size={13} />
                            }
                            {confirming ? 'Starting…' : 'Confirm Payment & Start'}
                        </button>
                    )}
                    {!loading && project?.status === 'delivered' && (
                        <button
                            onClick={() => setShowInvoiceModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#7c3aed] text-white rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-[#6d28d9] transition-colors"
                        >
                            <CreditCard size={13} /> Create Invoice
                        </button>
                    )}
                </div>
            </div>

            {/* ── Title ───────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="mb-8">
                    <Skeleton className="h-9 w-96 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
            ) : (
                <div className="mb-7">
                    <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none mb-1.5">
                        {project?.title}
                    </h1>
                    <p className="text-sm text-[#6b7280]">
                        {project?.service_type?.replace(/_/g, ' ')}
                        {project?.client_name && ` · Client: ${project.client_name}`}
                        {project?.expert_name && ` · Expert: ${project.expert_name}`}
                        {project?.deadline && ` · Due ${fmtDate(project.deadline)}`}
                    </p>
                </div>
            )}

            {/* ── Confirm Start Banner ─────────────────────────────────────────── */}
            {showConfirmStart && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                        <div>
                            <div className="text-[13px] font-bold text-amber-800">Payment received from client</div>
                            <div className="text-[12px] text-amber-600 mt-0.5">
                                Client has submitted the 50% upfront payment. Confirm to start the project and notify the expert.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleConfirmStart}
                        disabled={confirming}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors disabled:opacity-60 ml-4"
                    >
                        {confirming ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                        {confirming ? 'Starting…' : 'Confirm & Start'}
                    </button>
                </div>
            )}

            {/* ── Stats ───────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4 mb-7">
                <StatCard label="Progress" loading={loading}>
                    <div className="text-2xl font-bold text-[#111827] leading-none mb-2">{progress}%</div>
                    <div className="h-1.5 bg-[#ede9fe] rounded-full overflow-hidden">
                        <div className="h-full bg-[#7c3aed] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-[11px] text-[#9ca3af] mt-1">{completedTasks}/{totalTasks} tasks</div>
                </StatCard>

                <StatCard label="Budget" loading={loading}>
                    <div className="text-2xl font-bold text-[#111827] leading-none">
                        {project?.total_price ? `${fmt(project.total_price)} DZD` : '—'}
                    </div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">total budget</div>
                </StatCard>

                <StatCard label="Team" loading={loading}>
                    <div className="text-2xl font-bold text-[#111827] leading-none">{team.length}</div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">
                        {expertsOnTeam.length} expert · {studentsOnTeam.length} student{studentsOnTeam.length !== 1 ? 's' : ''}
                    </div>
                </StatCard>

                <StatCard label="Status" loading={loading}>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ${st.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                    </span>
                    {showConfirmStart && (
                        <div className="text-[11px] text-amber-600 font-bold mt-1.5 flex items-center gap-1">
                            <AlertCircle size={10} /> Awaiting confirmation
                        </div>
                    )}
                </StatCard>
            </div>

            {/* ── Main grid ───────────────────────────────────────────────────── */}
            <div className="flex gap-5">

                {/* Left — tasks + description */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">

                    {/* Description */}
                    {!loading && project?.description && (
                        <div className="bg-white rounded-2xl border border-[#ede9fe] px-6 py-5">
                            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Project Brief</div>
                            <p className="text-[13px] text-[#374151] leading-relaxed">{project.description}</p>
                            {project.skills_needed && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {project.skills_needed.split(',').map(s => (
                                        <span key={s} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#f5f3ff] text-[#7c3aed]">
                                            {s.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tasks */}
                    <div className="bg-white rounded-2xl border border-[#ede9fe] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f5f3ff] flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Tasks</span>
                            {!loading && tasks.length > 0 && (
                                <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                                    {completedTasks}/{totalTasks}
                                </span>
                            )}
                        </div>
                        {loading ? (
                            <div className="p-6 space-y-3">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="px-6 py-10 text-center text-[12px] text-[#9ca3af]">
                                No tasks yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-[#f5f3ff]">
                                {tasks.map(task => {
                                    const ts = TASK_STATUS[task.status] || TASK_STATUS.open;
                                    const TIcon = ts.icon;
                                    return (
                                        <div key={task.id} className="px-6 py-4 flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${ts.bg}`}>
                                                <TIcon size={14} className={ts.color} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] font-semibold text-[#111827] truncate">{task.title}</div>
                                                {task.description && (
                                                    <div className="text-[11px] text-[#9ca3af] mt-0.5 truncate">{task.description}</div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {task.weight_pct && (
                                                    <span className="text-[10px] font-bold text-[#9ca3af]">{task.weight_pct}%</span>
                                                )}
                                                {task.due_date && (
                                                    <span className="text-[10px] text-[#9ca3af]">{fmtDate(task.due_date)}</span>
                                                )}
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ts.bg} ${ts.color}`}>
                                                    {ts.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Payments */}
                    <div className="bg-white rounded-2xl border border-[#ede9fe] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f5f3ff] flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Payments</span>
                            {!loading && project?.status === 'delivered' && (
                                <button
                                    onClick={() => setShowInvoiceModal(true)}
                                    className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest hover:underline"
                                >
                                    + Create Invoice
                                </button>
                            )}
                        </div>
                        {loading ? (
                            <div className="p-6 space-y-3">
                                {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="px-6 py-10 text-center text-[12px] text-[#9ca3af]">
                                No payments yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-[#f5f3ff]">
                                {payments.map(pay => {
                                    const pcfg = PAYMENT_STATUS_CFG[pay.status] || { label: pay.status, cls: 'bg-gray-100 text-gray-500' };
                                    const isUpdating = updatingPayment === pay.id;
                                    return (
                                        <div key={pay.id} className="px-6 py-4 flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
                                                <CreditCard size={14} className="text-[#7c3aed]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] font-semibold text-[#111827]">
                                                    {fmt(pay.amount)} DZD
                                                    {pay.recipient_name && (
                                                        <span className="text-[11px] font-normal text-[#9ca3af] ml-2">→ {pay.recipient_name}</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-[#9ca3af] mt-0.5">
                                                    {fmtDate(pay.created_at)}
                                                    {pay.method && ` · ${pay.method.replace(/_/g, ' ')}`}
                                                    {pay.transaction_ref && ` · ${pay.transaction_ref}`}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${pcfg.cls}`}>
                                                {pcfg.label}
                                            </span>
                                            {/* Admin actions */}
                                            {pay.status === 'client_paid' && (
                                                <button
                                                    onClick={() => handleUpdatePayment(pay.id, 'released')}
                                                    disabled={isUpdating}
                                                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
                                                >
                                                    {isUpdating ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                                                    Release
                                                </button>
                                            )}
                                            {pay.status === 'pending' && (
                                                <button
                                                    onClick={() => handleUpdatePayment(pay.id, 'client_paid')}
                                                    disabled={isUpdating}
                                                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
                                                >
                                                    {isUpdating ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={10} />}
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="w-72 flex-shrink-0 flex flex-col gap-4">

                    {/* Project info */}
                    <div className="bg-white rounded-2xl border border-[#ede9fe] p-5">
                        <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Project Info</div>
                        {loading ? (
                            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}</div>
                        ) : (
                            <div className="space-y-3">
                                {[
                                    { label: 'Client', value: project?.client_name },
                                    { label: 'Expert', value: project?.expert_name },
                                    { label: 'Service', value: project?.service_type?.replace(/_/g, ' ') },
                                    { label: 'Deadline', value: fmtDate(project?.deadline) },
                                    { label: 'Started', value: fmtDate(project?.started_at) },
                                    { label: 'Budget', value: project?.total_price ? `${fmt(project.total_price)} DZD` : '—' },
                                ].map(({ label, value }) => value && (
                                    <div key={label} className="flex justify-between items-start gap-2">
                                        <span className="text-[11px] text-[#9ca3af] flex-shrink-0">{label}</span>
                                        <span className="text-[12px] font-semibold text-[#111827] text-right capitalize">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Team */}
                    <div className="bg-white rounded-2xl border border-[#ede9fe] p-5">
                        <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Team</div>
                        {loading ? (
                            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                        ) : team.length === 0 ? (
                            <div className="text-[11px] text-[#9ca3af] text-center py-4">No team assigned yet.</div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {team.map(m => (
                                    <div key={m.id} className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-[#ede9fe] flex items-center justify-center text-xs font-bold text-[#7c3aed] flex-shrink-0">
                                            {getInitials(m.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[12px] font-semibold text-[#111827] truncate">{m.name}</div>
                                            <div className="text-[10px] text-[#9ca3af] capitalize">
                                                {m.role}{m.domain ? ` · ${m.domain.replace(/_/g, ' ')}` : ''}
                                            </div>
                                        </div>
                                        <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0
                      ${m.role === 'expert' ? 'bg-[#f5f3ff] text-[#7c3aed]' : 'bg-green-50 text-green-700'}`}>
                                            {m.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick nav */}
                    <div className="bg-white rounded-2xl border border-[#ede9fe] p-5">
                        <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Quick Access</div>
                        <div className="space-y-0.5">
                            {[
                                { label: 'All Projects', path: '/admin/projects' },
                                { label: 'Approvals', path: '/admin/approvals' },
                                { label: 'Payments', path: '/admin/payments' },
                            ].map(({ label, path }) => (
                                <button key={path} onClick={() => navigate(path)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] text-[#374151] text-left hover:bg-[#f5f3ff] transition-colors">
                                    {label}
                                    <ChevronRight size={12} className="text-[#d1d5db]" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Invoice Modal ────────────────────────────────────────────────── */}
            {showInvoiceModal && (
                <CreateInvoiceModal
                    project={project}
                    team={team}
                    onClose={() => setShowInvoiceModal(false)}
                    onCreated={loadData}
                />
            )}
        </div>
    );
}