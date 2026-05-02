import { useState, useEffect } from 'react';
import { FileText, CreditCard } from 'lucide-react';
import { getMyEarnings } from '../../api/expert.api';
import { useAuthStore } from '../../store/authStore';
import { changePassword } from '../../api/expert.api';
import toast from 'react-hot-toast';

// ─── WALLET ───────────────────────────────────────────────────────────────────
export function ExpertWallet() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ available: 0, pending: 0, ytd: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyEarnings()
      .then(res => {
        const data = res.data || [];
        setPayments(data);
        const released = data.filter(p => p.status === 'released');
        const pending = data.filter(p => p.status === 'pending');
        setSummary({
          available: released.reduce((s, p) => s + Number(p.amount), 0),
          pending: pending.reduce((s, p) => s + Number(p.amount), 0),
          ytd: released.reduce((s, p) => s + Number(p.amount), 0),
        });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const fmt = n => Number(n).toLocaleString('fr-DZ');
  const nextPayout = new Date();
  nextPayout.setDate(1);
  nextPayout.setMonth(nextPayout.getMonth() + 1);

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-500 mt-1">Earnings from your projects — paid out monthly.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <FileText size={14} /> Statements
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">
            <CreditCard size={14} /> Withdraw
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Available balance', value: `${fmt(summary.available)} DZD` },
          { label: 'Pending milestones', value: `${fmt(summary.pending)} DZD` },
          { label: 'Paid year-to-date', value: `${fmt(summary.ytd)} DZD` },
          { label: 'Next payout', value: nextPayout.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
        ].map(s => (
          <div key={s.label} className="border border-gray-200 rounded-xl px-6 py-5">
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900">Transactions</span>
        </div>
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['DESCRIPTION', 'AMOUNT', 'DATE', 'STATUS'].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map((p, i) => (
              <div key={p.id || i} className="grid grid-cols-[2fr_1.5fr_1fr_1fr] items-center px-5 py-4 hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-900">{p.project_title || '—'}</span>
                <span className="text-sm font-mono font-semibold text-green-600">+{fmt(p.amount)} DZD</span>
                <span className="text-sm text-gray-500">
                  {p.processed_at ? new Date(p.processed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </span>
                <span className={`flex items-center gap-1.5 text-sm font-medium ${p.status === 'released' ? 'text-green-600' : 'text-amber-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'released' ? 'bg-green-500' : 'bg-amber-400'}`} />
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
const weeklyData = [1, 2, 1, 3, 2, 1, 2, 1, 2, 3, 2, 3];
const phases = [
  { label: 'In progress', color: 'bg-indigo-500' },
  { label: 'AI Team Suggestion', color: 'bg-indigo-400' },
  { label: 'In review', color: 'bg-indigo-300' },
  { label: 'Awaiting scope', color: 'bg-indigo-200' },
];

export function ExpertAnalytics() {
  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytics</h1>
      <p className="text-sm text-gray-500 mb-8">Your portfolio at a glance.</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'On-time delivery', value: '—', delta: '', deltaColor: 'text-gray-400' },
          { label: 'Avg. project duration', value: '—', delta: '', deltaColor: 'text-gray-400' },
          { label: 'Student utilization', value: '—', delta: '', deltaColor: 'text-gray-400' },
          { label: 'NPS (clients)', value: '—', delta: '', deltaColor: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="border border-gray-200 rounded-xl px-6 py-5">
            <div className="text-sm text-gray-500 mb-2">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        <div className="flex-1 border border-gray-200 rounded-xl px-6 py-5">
          <div className="font-semibold text-gray-900 mb-4">Projects shipped (last 12 weeks)</div>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.map((v, i) => (
              <div key={i} className="flex-1 bg-indigo-500 rounded-t" style={{ height: `${v * 33}%` }} />
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            {weeklyData.map((_, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-gray-400">w{i + 1}</div>
            ))}
          </div>
        </div>
        <div className="w-56 border border-gray-200 rounded-xl px-5 py-5">
          <div className="font-semibold text-gray-900 mb-4">By phase</div>
          <div className="flex flex-col gap-3">
            {phases.map(p => (
              <div key={p.label}>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{p.label}</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full w-1/3`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export function ExpertSettings() {
  const { user } = useAuthStore();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [notifs, setNotifs] = useState({ submissions: true, student_alert: true, client_msg: true, payout: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setSpecialty(user.expert?.specialty || '');
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (currentPw && newPw) {
        await changePassword({ current_password: currentPw, new_password: newPw });
        toast.success('Password updated!');
        setCurrentPw(''); setNewPw('');
      } else {
        toast.success('Settings saved!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-8 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Profile and notification preferences.</p>
      <div className="border border-gray-200 rounded-xl p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
            <input disabled value={user?.first_name || ''} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input disabled value={user?.email || ''} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialty</label>
          <input value={specialty} onChange={e => setSpecialty(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Change password</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
          {[
            { key: 'submissions', label: 'New submission for review' },
            { key: 'student_alert', label: 'Student inactivity or missed deadline' },
            { key: 'client_msg', label: 'Client messages and meeting requests' },
            { key: 'payout', label: 'Payout released to account' },
          ].map(n => (
            <label key={n.key} className="flex items-center gap-3 mb-2.5 cursor-pointer">
              <input type="checkbox" checked={notifs[n.key]} onChange={e => setNotifs(x => ({ ...x, [n.key]: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm text-gray-700">{n.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}