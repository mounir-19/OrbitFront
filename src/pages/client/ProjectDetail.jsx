import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Zap, Lock, Download,
  CheckCircle, Clock, AlertCircle, ChevronRight,
} from 'lucide-react';
import {
  getClientProject,
  getClientInvoices,
  getProjectTasks,
  payInvoice,
  initiatePayment,
  startConversation,
} from '../../api/client.api';
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

// ─── Shared form primitives (MUST be at module level — never inside a component) ──
const L = ({ children }) => (
  <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-widest mb-2">
    {children}
  </label>
);

const F = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 text-[14px] text-[#111827]
      outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#f5f3ff] transition-all
      placeholder:text-[#d1d5db] ${className}`}
  />
);

// ─── Payment Page ─────────────────────────────────────────────────────────────
function PaymentPage({ project, invoice, paymentType = 'final', onBack, onSuccess }) {
  const [cardNum, setCardNum] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [holder, setHolder] = useState('');
  const [paying, setPaying] = useState(false);

  const is50pct = paymentType === '50_percent';
  const amount = is50pct
    ? Math.round(Number(project?.total_price || 0) / 2)
    : invoice ? Number(invoice.amount) : Number(project?.total_price || 0);

  const title = is50pct ? 'Pay 50% to Start' : 'Pay Final Balance';
  const subtitle = is50pct
    ? 'Pay the upfront deposit to kick off your project. Work begins once payment is confirmed.'
    : 'Complete the final payment to release escrow to the team and unlock all project files.';

  const cardDisplay = cardNum.replace(/(\d{4})(?=\d)/g, '$1 ');

  const handleCardNum = (e) => {
    const cursorPos = e.target.selectionStart;
    const prevVal = e.target.value;
    const raw = prevVal.replace(/\D/g, '').slice(0, 16);
    setCardNum(raw);

    requestAnimationFrame(() => {
      if (e.target) {
        const spacesBeforeCursor = (prevVal.slice(0, cursorPos).match(/ /g) || []).length;
        const newSpaces = (raw.replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, cursorPos).match(/ /g) || []).length;
        const newPos = cursorPos + (newSpaces - spacesBeforeCursor);
        e.target.setSelectionRange(newPos, newPos);
      }
    });
  };

  const expiry = expiryMonth && expiryYear ? `${expiryMonth} / ${expiryYear}` : '';

  const handlePay = async () => {
    if (!cardNum || cardNum.length < 16) { toast.error('Enter a valid 16-digit card number.'); return; }
    if (!expiryMonth || !expiryYear) { toast.error('Enter a valid expiry date.'); return; }
    if (!cvc || cvc.length < 3) { toast.error('Enter your CVC.'); return; }
    if (!holder.trim()) { toast.error('Enter the cardholder name.'); return; }

    setPaying(true);
    try {
      if (is50pct) {
        await initiatePayment({
          project_id: project.project_id || project.id,
          amount,
          payment_type: '50_percent',
        });
        toast.success('Payment confirmed! Project is now in progress.');
      } else if (pendingInvoice) {
        await payInvoice(pendingInvoice.id, { status: 'client_paid' });
        toast.success('Payment confirmed! Admin will review and release deliverables.');
      } else {
        toast.error('No active invoice found.');
        return;
      }
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Payment failed. Please try again.';
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-8 hover:text-[#7c3aed] transition-colors"
        >
          <ArrowLeft size={13} /> Back to project
        </button>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none mb-1.5">
            {title}
          </h1>
          <p className="text-sm text-[#6b7280]">{subtitle}</p>
        </div>

        <div className="grid grid-cols-5 gap-8">

          {/* ── Left — Card form ─────────────────────────────────────────────── */}
          <div className="col-span-3 space-y-5">

            {/* Edahabia badge */}
            <div className="flex items-center gap-3 bg-white border border-[#ede9fe] rounded-2xl px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-black text-[#7c3aed]">CIB</span>
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#111827]">CIB / Edahabia</div>
                <div className="text-[11px] text-[#9ca3af]">Algeria Post · SATIM network</div>
              </div>
              <div className="ml-auto w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center flex-shrink-0">
                <CheckCircle size={12} className="text-white" />
              </div>
            </div>

            {/* Card number */}
            <div>
              <L>Card Number</L>
              <input
                value={cardDisplay}
                onChange={handleCardNum}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                className="w-full bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 text-[14px] text-[#111827]
                  outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#f5f3ff] transition-all
                  placeholder:text-[#d1d5db] tracking-widest"
              />
            </div>

            {/* Expiry + CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <L>Expiry Date</L>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={expiryMonth}
                    onChange={e => setExpiryMonth(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3 py-3 text-[14px] text-[#111827] outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#f5f3ff] transition-all appearance-none"
                  >
                    <option value="">Month</option>
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={expiryYear}
                    onChange={e => setExpiryYear(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3 py-3 text-[14px] text-[#111827] outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#f5f3ff] transition-all appearance-none"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const y = String(new Date().getFullYear() + i).slice(-2);
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div>
                <L>CVC</L>
                <F
                  value={cvc}
                  onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="• • •"
                  inputMode="numeric"
                  type="password"
                />
              </div>
            </div>

            {/* Cardholder name */}
            <div>
              <L>Cardholder Name</L>
              <F
                value={holder}
                onChange={e => setHolder(e.target.value)}
                placeholder="As it appears on your card"
              />
            </div>

            {/* Escrow note */}
            <p className="text-[11px] text-[#9ca3af] leading-relaxed">
              Funds are held in escrow and only released when you confirm delivery. You can dispute within 7 days.
            </p>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-[#7c3aed] text-white rounded-2xl text-[13px] font-bold uppercase tracking-widest disabled:opacity-60 hover:bg-[#6d28d9] transition-colors"
            >
              {paying
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Zap size={16} />
              }
              {paying ? 'Processing...' : `Pay ${fmt(amount)} DZD`}
            </button>
          </div>

          {/* ── Right — Summary ──────────────────────────────────────────────── */}
          <div className="col-span-2">
            <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden sticky top-8">

              <div className="bg-[#1e1b4b] px-5 py-5">
                <div className="text-[10px] font-bold text-[#a5b4fc] uppercase tracking-widest mb-1">
                  {is50pct ? '50% Deposit' : 'Final Payment'}
                </div>
                <div className="text-[15px] font-bold text-white leading-snug">
                  {project?.title}
                </div>
              </div>

              <div className="px-5 py-5 space-y-3">
                {is50pct ? (
                  <>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6b7280]">Project total</span>
                      <span className="font-semibold text-[#111827]">{fmt(project?.total_price || 0)} DZD</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6b7280]">Due now (50%)</span>
                      <span className="font-semibold text-[#111827]">{fmt(amount)} DZD</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6b7280]">On delivery (50%)</span>
                      <span className="font-semibold text-[#9ca3af]">{fmt(amount)} DZD</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6b7280]">Project total</span>
                      <span className="font-semibold text-[#111827]">{fmt(project?.total_price || 0)} DZD</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6b7280]">Already paid</span>
                      <span className="font-semibold text-green-600">− {fmt(Math.round(Number(project?.total_price || 0) / 2))} DZD</span>
                    </div>
                  </>
                )}
                <div className="border-t border-[#f5f3ff] pt-3 flex justify-between">
                  <span className="text-[13px] font-bold text-[#111827]">Total due today</span>
                  <span className="text-[15px] font-bold text-[#7c3aed]">{fmt(amount)} DZD</span>
                </div>
              </div>

              {project?.deadline && (
                <div className="px-5 pb-5">
                  <div className="bg-[#f5f3ff] rounded-xl px-4 py-3 text-[11px] text-[#7c3aed]">
                    Project deadline: {new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.allSettled([
      getClientProject(id),
      getProjectTasks(id),
      api.get(`/projects/${id}/team`),
      getClientInvoices({ project_id: id }),
    ]).then(([projRes, tasksRes, teamRes, invRes]) => {
      if (projRes.status === 'fulfilled') {
        setProject(projRes.value.data);
      } else {
        setError('Project not found.');
      }
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data || []);
      if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data || []);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingInvoice = invoices.find(i => i.status === 'pending');
  const alreadyPaid50 = project?.payment_initiated || project?.payment_confirmed ||
    invoices.some(i => ['client_paid', 'released', 'processed'].includes(i.status));
  const st = STATUS_CONFIG[project?.status] || { label: project?.status, pill: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
  const isDelivered = ['delivered', 'in_review'].includes(project?.status);
  const expertsOnTeam = team.filter(m => m.role === 'expert');
  const studentsOnTeam = team.filter(m => m.role === 'student');

  const show50pctCTA = !loading && project?.status === 'accepted' && !alreadyPaid50;
  const showFinalCTA = !loading && !!pendingInvoice;

  // ── Chat with expert ───────────────────────────────────────────────────────
  const handleChatExpert = async () => {
    const expertId = project?.expert_id;
    if (!expertId) { toast.error('No expert assigned yet.'); return; }
    setChatLoading(true);
    try {
      await startConversation(expertId, id);
      navigate('/client/messages');
    } catch {
      navigate('/client/messages');
    } finally {
      setChatLoading(false);
    }
  };

  if (showPayment && project) {
    return (
      <PaymentPage
        project={project}
        invoice={pendingInvoice}
        paymentType={show50pctCTA ? '50_percent' : 'final'}
        onBack={() => setShowPayment(false)}
        onSuccess={() => { setShowPayment(false); loadData(); }}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] px-8 py-8 flex flex-col items-center justify-center">
        <div className="text-sm text-red-500 mb-4">{error}</div>
        <button onClick={() => navigate('/client/projects')} className="text-[#7c3aed] text-sm font-bold">
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
          onClick={() => navigate('/client/projects')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest hover:text-[#7c3aed] transition-colors"
        >
          <ArrowLeft size={13} /> Back to projects
        </button>
        <div className="flex gap-2">
          {project?.expert_id && (
            <button
              onClick={handleChatExpert}
              disabled={chatLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-[#ede9fe] bg-white rounded-xl text-[12px] font-bold text-[#7c3aed] uppercase tracking-widest hover:bg-[#f5f3ff] transition-colors disabled:opacity-60"
            >
              <MessageCircle size={14} />
              {chatLoading ? 'Opening...' : 'Chat with Expert'}
            </button>
          )}
          {(show50pctCTA || showFinalCTA) && (
            <button
              onClick={() => setShowPayment(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#7c3aed] text-white rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-[#6d28d9] transition-colors"
            >
              <Zap size={14} /> {show50pctCTA ? 'Pay 50% to Start' : 'Pay to Receive'}
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
            {project?.expert_name && ` · Expert: ${project.expert_name}`}
            {project?.deadline && ` · Due ${fmtDate(project.deadline)}`}
          </p>
        </div>
      )}

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

        <StatCard label="Remaining to Pay" loading={loading}>
          <div className="text-2xl font-bold text-[#111827] leading-none">
            {project?.payment_confirmed
              ? '—'
              : project?.payment_initiated
                ? `${fmt(Math.round(Number(project?.total_price || 0) / 2))} DZD`
                : project?.total_price
                  ? `${fmt(Number(project.total_price))} DZD`
                  : '—'}
          </div>
          <div className="text-[11px] text-[#9ca3af] mt-0.5">
            {project?.payment_confirmed
              ? 'fully paid'
              : project?.payment_initiated
                ? 'final balance'
                : 'total due'}
          </div>
        </StatCard>

        <StatCard label="Status" loading={loading}>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ${st.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          {pendingInvoice && (
            <div className="text-[11px] text-amber-600 font-bold mt-1.5 flex items-center gap-1">
              <AlertCircle size={10} /> Payment due
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
            <div className="px-6 py-4 border-b border-[#f5f3ff] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Tasks</span>
                {!loading && tasks.length > 0 && (
                  <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] px-2 py-0.5 rounded-full">
                    {completedTasks}/{totalTasks}
                  </span>
                )}
              </div>
              {isDelivered && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                  <Lock size={10} /> Locked until payment
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="px-6 py-10 text-center text-[12px] text-[#9ca3af]">
                No tasks yet. Tasks will appear once the expert sets up the project.
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
        </div>

        {/* Right sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">

          {/* 50% upfront CTA */}
          {!loading && project?.status === 'accepted' && !alreadyPaid50 && (
            <div className="bg-[#1e1b4b] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="font-bold text-white text-sm">Ready to Start</span>
              </div>
              <p className="text-[12px] text-[#a5b4fc] mb-4 leading-relaxed">
                Your expert has scoped the project and a team is ready. Pay 50% upfront to kick off the work.
              </p>
              {project.total_price && (
                <div className="flex justify-between text-[13px] text-[#a5b4fc] mb-4 border-t border-white/10 pt-3">
                  <span>50% upfront</span>
                  <span className="font-bold text-white">{fmt(Number(project.total_price) / 2)} DZD</span>
                </div>
              )}
              <button
                onClick={() => setShowPayment(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7c3aed] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#6d28d9] transition-colors"
              >
                <Zap size={13} /> Pay 50% to Start
              </button>
            </div>
          )}

          {!loading && project?.payment_initiated && !project?.payment_confirmed && (
            <div className="bg-[#1e1b4b] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Clock size={14} className="text-white" />
                </div>
                <span className="font-bold text-white text-sm">Payment Received</span>
              </div>
              <p className="text-[12px] text-[#a5b4fc] leading-relaxed">
                Your payment is being verified by our team. Work will begin shortly.
              </p>
            </div>
          )}

          {/* Final payment CTA */}
          {!loading && pendingInvoice && (
            <div className="bg-[#1e1b4b] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="font-bold text-white text-sm">Ready to Receive</span>
              </div>
              <p className="text-[12px] text-[#a5b4fc] mb-4 leading-relaxed">
                Your team delivered the full scope. Pay the final balance to unlock deliverables and release escrow.
              </p>
              <div className="flex justify-between text-[13px] text-[#a5b4fc] mb-4 border-t border-white/10 pt-3">
                <span>Final payment</span>
                <span className="font-bold text-white">{fmt(pendingInvoice.amount)} DZD</span>
              </div>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7c3aed] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#6d28d9] transition-colors"
              >
                <Zap size={13} /> Pay & Receive Files
              </button>
            </div>
          )}

          {/* Team */}
          <div className="bg-white rounded-2xl border border-[#ede9fe] p-5">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Your Expert</div>
            {loading ? (
              <div className="space-y-3">
                {[1].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : expertsOnTeam.length === 0 ? (
              <div className="text-[11px] text-[#9ca3af] text-center py-4">No expert assigned yet.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {expertsOnTeam.map(m => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#ede9fe] flex items-center justify-center text-xs font-bold text-[#7c3aed] flex-shrink-0">
                        {getInitials(m.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[#111827] truncate">{m.name}</div>
                        <div className="text-[10px] text-[#9ca3af] capitalize">
                          Expert{m.domain ? ` · ${m.domain.replace(/_/g, ' ')}` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleChatExpert}
                      className="w-7 h-7 rounded-lg border border-[#ede9fe] flex items-center justify-center hover:bg-[#f5f3ff] transition-colors flex-shrink-0"
                    >
                      <MessageCircle size={12} className="text-[#7c3aed]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          {!loading && invoices.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#ede9fe] p-5">
              <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Invoices</div>
              <div className="flex flex-col gap-2">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-semibold text-[#111827]">{fmt(inv.amount)} DZD</div>
                      <div className="text-[10px] text-[#9ca3af]">{fmtDate(inv.created_at)}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status === 'released' ? 'bg-green-50 text-green-700'
                      : inv.status === 'pending' ? 'bg-amber-50 text-amber-700'
                        : 'bg-[#f3f4f6] text-[#6b7280]'
                      }`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/client/invoices')}
                className="w-full mt-4 pt-3 border-t border-[#f5f3ff] text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest text-center flex items-center justify-center gap-1"
              >
                All Invoices <ChevronRight size={10} />
              </button>
            </div>
          )}

          {/* Quick nav */}
          <div className="bg-white rounded-2xl border border-[#ede9fe] p-5">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Quick Access</div>
            <div className="space-y-0.5">
              {[
                { label: 'All Projects', path: '/client/projects' },
                { label: 'Invoices', path: '/client/invoices' },
                { label: 'Messages', path: '/client/messages' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] text-[#374151] text-left hover:bg-[#f5f3ff] transition-colors"
                >
                  {label}
                  <ChevronRight size={12} className="text-[#d1d5db]" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}