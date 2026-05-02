import { useState, useEffect } from 'react';
import { getApplications, getUsers, getPayouts, updateApplication, updateUserStatus, updatePayment } from '../../api/admin.api';
import { Star, FolderOpen, User, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const typeIconMap = {
  Expert: <Star size={16} className="text-yellow-500" />,
  Student: <User size={16} className="text-blue-500" />,
  Payout: <CreditCard size={16} className="text-purple-500" />,
};
const typeBg = { Expert: 'bg-yellow-50', Brief: 'bg-amber-50', Student: 'bg-blue-50', Payout: 'bg-purple-50' };

const TABS = ['All', 'Experts', 'Students', 'Payouts'];

export default function Approvals() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      getUsers({ status: 'pending' }),
      getPayouts({ status: 'pending' }),
    ]).then(([usersRes, paymentsRes]) => {
      const pending = [];

      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value.data?.users || [];
        users.forEach(u => pending.push({
          id: u.id,
          kind: u.role === 'expert' ? 'Expert' : 'Student',
          name: `${u.first_name} ${u.last_name}`,
          meta: `${u.email} · ${u.domain?.replace(/_/g, ' ') || u.role}`,
          time: u.created_at ? new Date(u.created_at).toLocaleDateString() : '—',
          flag: u.role === 'student' ? '▶ Pending ID verification' : '▶ Pending expert review',
          _raw: u,
        }));
      }

      if (paymentsRes.status === 'fulfilled') {
        const payments = paymentsRes.value.data || [];
        payments.forEach(p => pending.push({
          id: p.id,
          kind: 'Payout',
          name: p.project_title || `Payment ${p.id?.slice(0, 8)}`,
          meta: `${Number(p.amount).toLocaleString()} DZD · ${p.recipient_name || '—'}`,
          time: p.created_at ? new Date(p.created_at).toLocaleDateString() : '—',
          flag: '▶ Ready to release',
          _raw: p,
        }));
      }

      setItems(pending);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = tab === 0 ? items
    : items.filter(i => i.kind === TABS[tab]);

  const tabCounts = TABS.map((t, i) => i === 0 ? items.length : items.filter(x => x.kind === t).length);

  const handleApprove = async (item) => {
    setApproving(item.id);
    try {
      if (item.kind === 'Payout') {
        await updatePayment(item.id, { status: 'released' });
      } else {
        await updateUserStatus(item.id, 'active');
      }
      setItems(prev => prev.filter(x => x.id !== item.id));
      toast.success('Approved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Approvals queue</h1>
      <p className="text-sm text-gray-500 mb-6">Experts, students, and payouts awaiting review.</p>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === i ? 'text-indigo-700 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t} ({tabCounts[i]})
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No items pending approval.</div>
        ) : filtered.map(a => (
          <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeBg[a.kind]}`}>
              {typeIconMap[a.kind] || <FolderOpen size={16} className="text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{a.name}</div>
              <div className="text-xs text-gray-500">{a.kind} · {a.meta}</div>
              {a.flag && <div className="text-xs text-gray-400 mt-0.5">{a.flag}</div>}
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{a.time}</span>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100">Review</button>
            <button onClick={() => handleApprove(a)} disabled={approving === a.id}
              className="px-3 py-1.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 disabled:opacity-60">
              {approving === a.id ? '...' : 'Approve'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}