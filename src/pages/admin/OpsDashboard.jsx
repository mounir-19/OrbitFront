import { useState, useEffect } from 'react';
import { TrendingUp, FolderOpen, Users, Star, Zap, User, Briefcase, CreditCard } from 'lucide-react';
import { getAllProjects, getUsers, getPayouts, getApplications, updateUserStatus, updatePayment } from '../../api/admin.api';

const typeIconMap = {
  expert: <Star size={16} className="text-yellow-500" />,
  student: <User size={16} className="text-blue-500" />,
  client: <Briefcase size={16} className="text-green-500" />,
  payment: <CreditCard size={16} className="text-purple-500" />,
};
const typeColor = { expert: 'bg-yellow-50', student: 'bg-blue-50', client: 'bg-green-50', payment: 'bg-purple-50' };

const systemHealth = [
  { label: 'API uptime (30d)', value: '99.98%', color: 'text-green-500' },
  { label: 'Matching p95', value: '2.1s', color: 'text-green-500' },
  { label: 'Payment gateway', value: 'OK', color: 'text-green-500' },
  { label: 'ID verification', value: 'Backlog: 14', color: 'text-orange-500' },
  { label: 'Email delivery', value: 'OK', color: 'text-green-500' },
];

export default function OpsDashboard() {
  const [stats, setStats] = useState({ projects: 0, users: 0, experts: 0, students: 0, clients: 0, gmv: 0 });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [uniFlow, setUniFlow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      getAllProjects({ status: 'in_progress' }),
      getUsers({ status: 'active' }),
      getUsers({ status: 'pending' }),
      getPayouts({ status: 'pending' }),
    ]).then(([projectsRes, activeUsersRes, pendingUsersRes, paymentsRes]) => {
      if (projectsRes.status === 'fulfilled') {
        setStats(s => ({ ...s, projects: projectsRes.value.data?.length || 0 }));
      }
      if (activeUsersRes.status === 'fulfilled') {
        const users = activeUsersRes.value.data?.users || [];
        setStats(s => ({
          ...s,
          users: users.length,
          experts: users.filter(u => u.role === 'expert').length,
          students: users.filter(u => u.role === 'student').length,
          clients: users.filter(u => u.role === 'client').length,
        }));

        // Group students by university for the flow widget
        const byUni = {};
        users.filter(u => u.role === 'student').forEach(u => {
          const uni = u.university || 'Unknown';
          byUni[uni] = (byUni[uni] || 0) + 1;
        });
        setUniFlow(Object.entries(byUni).map(([name, active]) => ({ name, active, total: active })));
      }
      if (pendingUsersRes.status === 'fulfilled') {
        const pending = pendingUsersRes.value.data?.users || [];
        setPendingUsers(pending.slice(0, 5));
      }
      if (paymentsRes.status === 'fulfilled') {
        const payments = paymentsRes.value.data || [];
        setPendingPayments(payments.slice(0, 3));
        const gmv = payments.filter(p => p.status === 'released').reduce((s, p) => s + Number(p.amount), 0);
        setStats(s => ({ ...s, gmv }));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleApproveUser = async (id) => {
    setApproving(id);
    try {
      await updateUserStatus(id, 'active');
      setPendingUsers(u => u.filter(x => x.id !== id));
    } catch { }
    setApproving(null);
  };

  const handleApprovePayment = async (id) => {
    setApproving(id);
    try {
      await updatePayment(id, { status: 'released' });
      setPendingPayments(p => p.map(x => x.id === id ? { ...x, status: 'released' } : x));
    } catch { }
    setApproving(null);
  };

  const fmt = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n;
  const gmvBars = [40, 55, 45, 60, 52, 65, 58, 70, 75, 80, 88, 95];

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform operations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${pendingUsers.length} users pending approval · ${pendingPayments.length} payments pending`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <TrendingUp size={14} /> Weekly report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">
            <Zap size={14} /> Pause matching
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2"><TrendingUp size={14} /> GMV released</div>
          <div className="text-2xl font-bold text-gray-900">{fmt(stats.gmv)} DZD</div>
          <div className="flex items-end gap-0.5 mt-3 h-10">
            {gmvBars.map((h, i) => <div key={i} className="flex-1 bg-indigo-400 rounded-sm opacity-70" style={{ height: `${h}%` }} />)}
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2"><FolderOpen size={14} /> Active projects</div>
          <div className="text-2xl font-bold text-gray-900">{stats.projects}</div>
        </div>
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2"><Users size={14} /> Active users</div>
          <div className="text-2xl font-bold text-gray-900">{stats.users}</div>
          <div className="text-xs text-gray-400 mt-1">{stats.experts} exp · {stats.students} stu · {stats.clients} cli</div>
        </div>
        <div className="border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2"><Star size={14} /> Avg CSAT</div>
          <div className="text-2xl font-bold text-gray-900 flex items-center gap-1"><Star size={18} className="text-yellow-400 fill-yellow-400" /> —</div>
          <div className="text-xs text-gray-400 mt-1">ratings pending</div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Pending users queue */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Approvals queue</span>
                <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">{pendingUsers.length} pending</span>
              </div>
            </div>
            {loading ? (
              <div className="px-5 py-6 text-sm text-gray-400 text-center">Loading...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-400 text-center">No pending approvals.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingUsers.map(u => (
                  <div key={u.id} className="px-5 py-4 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor[u.role]}`}>
                      {typeIconMap[u.role] || <User size={16} className="text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-gray-500 capitalize">{u.role} · {u.email} · {u.domain?.replace(/_/g, ' ') || '—'}</div>
                    </div>
                    <span className="text-xs text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
                    <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Review</button>
                    <button onClick={() => handleApproveUser(u.id)} disabled={approving === u.id}
                      className="px-3 py-1.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 disabled:opacity-60">
                      {approving === u.id ? '...' : 'Approve'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending payments */}
          {pendingPayments.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <span className="font-semibold text-gray-900">Payments pending release</span>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingPayments.map(p => (
                  <div key={p.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={16} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{p.project_title || p.project_id}</div>
                      <div className="text-xs text-gray-500">{p.recipient_name || p.recipient_id} · {Number(p.amount).toLocaleString()} DZD</div>
                    </div>
                    <button onClick={() => handleApprovePayment(p.id)} disabled={approving === p.id || p.status === 'released'}
                      className="px-3 py-1.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 disabled:opacity-60">
                      {p.status === 'released' ? 'Released' : approving === p.id ? '...' : 'Release'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
          <div className="border border-indigo-100 bg-indigo-50 rounded-xl px-5 py-4">
            <div className="text-xs font-semibold text-indigo-500 mb-2 flex items-center gap-1"><Zap size={11} /> System insight</div>
            <div className="font-semibold text-gray-900 mb-2">{stats.experts} experts active</div>
            <p className="text-xs text-gray-600 mb-3">{stats.students} students in pool · {stats.clients} client organisations.</p>
            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              <Users size={13} /> Review pipeline
            </button>
          </div>

          {uniFlow.length > 0 && (
            <div className="border border-gray-200 rounded-xl px-5 py-4">
              <div className="font-semibold text-gray-900 mb-3">Universities — student flow</div>
              <div className="flex flex-col gap-2.5">
                {uniFlow.slice(0, 5).map(u => (
                  <div key={u.name}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="truncate">{u.name}</span>
                      <span className="text-gray-400 flex-shrink-0 ml-1">{u.active}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.min((u.active / Math.max(...uniFlow.map(x => x.active))) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-xl px-5 py-4">
            <div className="font-semibold text-gray-900 mb-3">System health</div>
            <div className="flex flex-col gap-2">
              {systemHealth.map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{s.label}</span>
                  <span className={`font-medium ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}