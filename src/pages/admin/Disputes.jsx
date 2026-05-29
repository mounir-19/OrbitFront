import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, X, RefreshCw, ChevronDown,
  ChevronUp, FolderOpen, User, MessageSquare, Zap, Clock,
} from 'lucide-react';
import { getDisputes, updateDispute } from '../../api/admin.api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (str = '') =>
  str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const TYPE_CFG = {
  rejection_contest: { label: 'Rejection Contest', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  quality_issue: { label: 'Quality Issue', color: 'text-red-600 bg-red-50 border-red-100' },
  non_delivery: { label: 'Non Delivery', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  payment_contest: { label: 'Payment Contest', color: 'text-purple-600 bg-purple-50 border-purple-100' },
};

const STATUS_CFG = {
  open: { label: 'Open', dot: 'bg-red-400', text: 'text-red-500' },
  under_review: { label: 'Under Review', dot: 'bg-amber-400', text: 'text-amber-500' },
  resolved: { label: 'Resolved', dot: 'bg-emerald-400', text: 'text-emerald-600' },
  dismissed: { label: 'Dismissed', dot: 'bg-[#d1d5db]', text: 'text-[#9ca3af]' },
};

const FILTERS = ['all', 'open', 'under_review', 'resolved', 'dismissed'];

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

// ─── Dispute Card ─────────────────────────────────────────────────────────────
function DisputeCard({ dispute, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(dispute.admin_note || '');
  const [acting, setActing] = useState(null);

  const typeCfg = TYPE_CFG[dispute.type] || { label: dispute.type, color: 'text-[#6b7280] bg-[#f5f3ff] border-[#ede9fe]' };
  const statusCfg = STATUS_CFG[dispute.status] || STATUS_CFG.open;
  const isSettled = dispute.status === 'resolved' || dispute.status === 'dismissed';

  const handleAction = async (status) => {
    setActing(status);
    try {
      const res = await updateDispute(dispute.id, { status, admin_note: note || undefined });
      toast.success(status === 'resolved' ? 'Dispute resolved ✓' : `Marked as ${status.replace('_', ' ')}`);
      onUpdated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally { setActing(null); }
  };

  const handleNoteOnly = async () => {
    if (!note.trim()) return;
    setActing('note');
    try {
      const res = await updateDispute(dispute.id, { admin_note: note });
      toast.success('Note saved');
      onUpdated(res.data);
    } catch { toast.error('Failed to save note'); }
    finally { setActing(null); }
  };

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all
      ${isSettled ? 'border-[#ede9fe] opacity-60' : 'border-[#ede9fe]'}`}>

      {/* Main row */}
      <div className="px-6 py-4 flex items-center gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#ede9fe] flex items-center justify-center text-[11px] font-bold text-[#7c3aed] flex-shrink-0">
          {getInitials(dispute.raised_by_name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[13px] font-semibold text-[#111827]">
              {dispute.raised_by_name}
            </span>
            <span className="text-[10px] text-[#9ca3af] capitalize bg-[#f5f3ff] px-2 py-0.5 rounded-full">
              {dispute.raised_by_role}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeCfg.color}`}>
              {typeCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#9ca3af]">
            {dispute.project_title && (
              <span className="flex items-center gap-1">
                <FolderOpen size={10} /> {dispute.project_title}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} /> {timeAgo(dispute.created_at)}
            </span>
          </div>
        </div>

        {/* Status */}
        <span className={`flex items-center gap-1.5 text-[11px] font-bold flex-shrink-0 ${statusCfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>

        {/* Expand */}
        <button onClick={() => setExpanded(v => !v)}
          className="p-2 hover:bg-[#f5f3ff] rounded-xl transition-colors flex-shrink-0">
          {expanded ? <ChevronUp size={14} className="text-[#7c3aed]" /> : <ChevronDown size={14} className="text-[#9ca3af]" />}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-6 pb-5 border-t border-[#f5f3ff] pt-4 space-y-4">
          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Description</p>
            <p className="text-[13px] text-[#374151] leading-relaxed bg-[#fafafa] border border-[#ede9fe] rounded-xl px-4 py-3">
              {dispute.description}
            </p>
          </div>

          {/* Admin note */}
          <div>
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Admin Note</p>
            <div className="flex gap-2">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                disabled={isSettled}
                placeholder="Add a resolution note…"
                rows={2}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] resize-none disabled:opacity-50 bg-white"
              />
              {!isSettled && (
                <button onClick={handleNoteOnly} disabled={acting === 'note' || !note.trim()}
                  className="px-3 py-2 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest hover:bg-[#f5f3ff] disabled:opacity-40 transition-colors">
                  {acting === 'note' ? '…' : 'Save'}
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isSettled && (
            <div className="flex items-center gap-2 pt-1">
              {dispute.status === 'open' && (
                <button onClick={() => handleAction('under_review')} disabled={!!acting}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest hover:bg-[#f5f3ff] disabled:opacity-50 transition-colors">
                  {acting === 'under_review' ? <RefreshCw size={11} className="animate-spin" /> : <MessageSquare size={11} />}
                  Start Review
                </button>
              )}
              <button onClick={() => handleAction('dismissed')} disabled={!!acting}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50 transition-colors">
                {acting === 'dismissed' ? <RefreshCw size={11} className="animate-spin" /> : <X size={11} />}
                Dismiss
              </button>
              <button onClick={() => handleAction('resolved')} disabled={!!acting}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">
                {acting === 'resolved' ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                Mark Resolved
              </button>
            </div>
          )}

          {isSettled && dispute.resolved_at && (
            <p className="text-[11px] text-[#9ca3af]">
              {dispute.status === 'resolved' ? 'Resolved' : 'Dismissed'} on {new Date(dispute.resolved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  const fetchDisputes = () => {
    setLoading(true);
    getDisputes()
      .then(res => setDisputes(res.data || []))
      .catch(() => toast.error('Failed to load disputes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleUpdated = (updated) => {
    setDisputes(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
  };

  const filtered = filter === 'all' ? disputes : disputes.filter(d => d.status === filter);

  const counts = {
    all: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    under_review: disputes.filter(d => d.status === 'under_review').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    dismissed: disputes.filter(d => d.status === 'dismissed').length,
  };

  const FILTER_LABELS = {
    all: 'All', open: 'Open', under_review: 'Under Review',
    resolved: 'Resolved', dismissed: 'Dismissed',
  };

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Disputes</h1>
          <p className="text-sm text-[#6b7280] mt-1.5">
            {loading ? 'Loading…' : `${counts.open} open · ${counts.under_review} under review`}
          </p>
        </div>
        <button onClick={fetchDisputes}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#ede9fe] bg-white rounded-xl text-[11px] font-bold text-[#6b7280] uppercase tracking-widest hover:bg-[#f5f3ff] transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open', value: counts.open, color: 'text-red-500' },
          { label: 'Under Review', value: counts.under_review, color: 'text-amber-500' },
          { label: 'Resolved', value: counts.resolved, color: 'text-emerald-600' },
          { label: 'Dismissed', value: counts.dismissed, color: 'text-[#9ca3af]' },
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
      <div className="flex items-center gap-2 mb-5 flex-wrap">
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

      {/* ── List ────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#ede9fe] rounded-2xl py-16 text-center">
          <CheckCircle size={22} className="text-[#ede9fe] mx-auto mb-2" />
          <p className="text-sm text-[#9ca3af]">No {FILTER_LABELS[filter].toLowerCase()} disputes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <DisputeCard key={d.id} dispute={d} onUpdated={handleUpdated} />
          ))}
        </div>
      )}

      {/* ── Dark info card ───────────────────────────────────────────────────── */}
      {!loading && disputes.length > 0 && (
        <div className="bg-[#1e1b4b] rounded-2xl p-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">Dispute Overview</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total', value: counts.all, color: 'text-white' },
              { label: 'Open', value: counts.open, color: 'text-red-400' },
              { label: 'Resolved', value: counts.resolved, color: 'text-emerald-400' },
              { label: 'Dismissed', value: counts.dismissed, color: 'text-[#a5b4fc]' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2.5 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-[#a5b4fc] mt-0.5 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}