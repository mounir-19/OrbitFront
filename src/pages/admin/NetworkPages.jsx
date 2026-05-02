import { useState, useEffect } from 'react';
import { Filter, Star } from 'lucide-react';
import { getUsers, updateUserStatus } from '../../api/admin.api';
import toast from 'react-hot-toast';

// ─── EXPERTS ──────────────────────────────────────────────────────────────────
export function Experts() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers({ role: 'expert' })
      .then(res => setExperts(res.data?.users || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <NetworkPage
      title="Experts"
      subtitle={`${experts.length} experts · ${experts.filter(e => e.status === 'active').length} active`}
      loading={loading}
      empty="No experts yet."
      cols={['NAME', 'SPECIALTY', 'DOMAIN', 'STATUS', '']}
      rows={experts.map(e => [
        <Person key={e.id} init={`${e.first_name?.[0] || ''}${e.last_name?.[0] || ''}`.toUpperCase()} name={`${e.first_name} ${e.last_name}`} sub={e.email} />,
        e.expert?.specialty || '—',
        e.domain?.replace(/_/g, ' ') || '—',
        <StatusBadge key={e.id} status={e.status} />,
        e,
      ])}
    />
  );
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────
export function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers({ role: 'student' })
      .then(res => setStudents(res.data?.users || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <NetworkPage
      title="Students"
      subtitle={`${students.length} total · ${students.filter(s => s.status === 'pending').length} pending approval`}
      loading={loading}
      empty="No students yet."
      cols={['NAME', 'UNIVERSITY', 'DOMAIN', 'RATING', 'STATUS', '']}
      rows={students.map(s => [
        <Person key={s.id} init={`${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase()} name={`${s.first_name} ${s.last_name}`} sub={s.email} />,
        s.student?.university || '—',
        s.domain?.replace(/_/g, ' ') || '—',
        s.student?.global_rating
          ? <span className="flex items-center gap-1"><Star size={13} className="text-yellow-400 fill-yellow-400" />{s.student.global_rating}</span>
          : '—',
        <StatusBadge key={s.id} status={s.status} />,
        s,
      ])}
    />
  );
}

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
export function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers({ role: 'client' })
      .then(res => setClients(res.data?.users || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} organisations</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Filter size={14} /> Filter</button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">+ Invite</button>
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['COMPANY', 'CONTACT', 'EMAIL', 'CITY', 'STATUS', ''].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : clients.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No clients yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {clients.map(c => (
              <div key={c.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] items-center px-5 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">
                    {`${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}`.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{c.client?.company || `${c.first_name} ${c.last_name}`}</span>
                </div>
                <span className="text-sm text-gray-600">{c.first_name} {c.last_name}</span>
                <span className="text-sm text-gray-500 truncate">{c.email}</span>
                <span className="text-sm text-gray-600">{c.client?.city || '—'}</span>
                <StatusBadge status={c.status} />
                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Open</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UNIVERSITIES (derived from students) ─────────────────────────────────────
export function Universities() {
  const [unis, setUnis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers({ role: 'student' })
      .then(res => {
        const students = res.data?.users || [];
        const byUni = {};
        students.forEach(s => {
          const uni = s.student?.university || 'Unknown';
          if (!byUni[uni]) byUni[uni] = { name: uni, total: 0, active: 0 };
          byUni[uni].total++;
          if (s.status === 'active') byUni[uni].active++;
        });
        setUnis(Object.values(byUni).sort((a, b) => b.total - a.total));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Universities</h1>
          <p className="text-sm text-gray-500 mt-1">Partner institutions and student throughput.</p>
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['UNIVERSITY', 'STUDENTS ENROLLED', 'ACTIVE'].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : unis.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No universities yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {unis.map(u => (
              <div key={u.name} className="grid grid-cols-[2fr_1fr_1fr] items-center px-5 py-4 hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-900">{u.name}</span>
                <span className="text-sm text-gray-600">{u.total}</span>
                <span className="text-sm text-gray-600">{u.active}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
const actionColor = {
  application_selected: 'bg-green-50 text-green-700',
  payment_update: 'bg-blue-50 text-blue-700',
  status_change: 'bg-orange-50 text-orange-700',
  user_approved: 'bg-indigo-50 text-indigo-700',
};

export function AuditLog() {
  // Backend doesn't have a dedicated audit log table yet
  // Showing recent user status changes as a proxy
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers({})
      .then(res => {
        const users = res.data?.users || [];
        // Build a pseudo audit log from user records
        const entries = users.slice(0, 20).map(u => ({
          id: u.id,
          time: u.created_at ? new Date(u.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—',
          actor: 'System',
          action: u.status === 'active' ? 'user_approved' : 'status_change',
          target: `${u.first_name} ${u.last_name} · ${u.role}`,
          ip: '—',
        }));
        setLogs(entries);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Audit log</h1>
      <p className="text-sm text-gray-500 mb-8">Administrative actions and system events.</p>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[0.8fr_1.5fr_2fr_2.5fr_1.5fr] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['WHEN', 'ACTOR', 'ACTION', 'TARGET', 'IP'].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No log entries.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((l, i) => (
              <div key={i} className="grid grid-cols-[0.8fr_1.5fr_2fr_2.5fr_1.5fr] items-center px-5 py-4 hover:bg-gray-50">
                <span className="text-sm font-mono text-gray-500">{l.time}</span>
                <span className="text-sm text-gray-700">{l.actor}</span>
                <span className={`text-xs font-mono px-2 py-1 rounded font-medium w-fit ${actionColor[l.action] || 'bg-gray-100 text-gray-600'}`}>{l.action}</span>
                <span className="text-sm text-gray-700">{l.target}</span>
                <span className="text-xs font-mono text-gray-400">{l.ip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────
function NetworkPage({ title, subtitle, loading, empty, cols, rows }) {
  const [suspending, setSuspending] = useState(null);

  const handleToggleStatus = async (user) => {
    setSuspending(user.id);
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(user.id, newStatus);
      toast.success(`User ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSuspending(null);
    }
  };

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Filter size={14} /> Filter</button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">+ Invite</button>
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid px-5 py-3 bg-gray-50 border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr) auto` }}>
          {[...cols, ''].map(h => <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>)}
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">{empty}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((row, i) => {
              const userObj = row[row.length - 1]; // last element is raw user
              const displayRow = row.slice(0, -1);
              return (
                <div key={i} className="grid items-center px-5 py-4 hover:bg-gray-50" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr) auto` }}>
                  {displayRow.map((cell, j) => <div key={j} className="text-sm text-gray-700">{cell}</div>)}
                  <button onClick={() => handleToggleStatus(userObj)} disabled={suspending === userObj?.id}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    {suspending === userObj?.id ? '...' : userObj?.status === 'suspended' ? 'Restore' : 'Open'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Person({ init, name, sub }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600 flex-shrink-0">{init}</div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
        {sub && <div className="text-xs text-gray-400 truncate">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-50 text-green-700',
    pending: 'bg-amber-50 text-amber-600',
    suspended: 'bg-red-50 text-red-600',
    inactive: 'bg-gray-100 text-gray-500',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}