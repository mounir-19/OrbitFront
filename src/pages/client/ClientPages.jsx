import { useState, useRef, useEffect } from 'react';
import { Send, Star, FileText } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { getClientInvoices, payInvoice as updatePayment } from '../../api/client.api';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
export function ClientMessages() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);

  const { messages, setMessages, sendMessage, startTyping, stopTyping, typingUsers, connected, setConvId } = useChat({ conversationId: selected?.id });

  useEffect(() => {
    api.get('/messages/conversations')
      .then(r => setConversations(r.data || []))
      .catch(() => { })
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setMessages([]);
    setLoadingMsgs(true);
    api.get(`/messages/conversations/${selected.id}`)
      .then(r => setMessages(r.data || []))
      .catch(() => { })
      .finally(() => setLoadingMsgs(false));
    setConvId(selected.id);
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !selected) return;
    sendMessage(input);
    setInput('');
  };

  const fmt = iso => iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="px-8 py-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <span className={`text-xs flex items-center gap-1 ${connected ? 'text-green-500' : 'text-gray-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} /> {connected ? 'Live' : 'Connecting...'}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">Chat directly with your expert and team.</p>

      <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex min-h-0">
        {/* Conversation list */}
        <div className="w-64 border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Conversations</span>
          </div>
          {loadingConvs ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">No conversations yet.</div>
          ) : conversations.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600 flex-shrink-0">
                  {initials(c.other_user_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-900 truncate">{c.other_user_name}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{fmt(c.last_message_at)}</span>
                  </div>
                  {c.project_title && <div className="text-xs text-indigo-500 mb-0.5 truncate">{c.project_title}</div>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 truncate">{c.last_message || 'No messages yet'}</span>
                    {Number(c.unread) > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 ml-1">{c.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Select a conversation</div>
          ) : (
            <>
              <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">
                    {initials(selected.other_user_name)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{selected.other_user_name}</div>
                    {selected.project_title && <div className="text-xs text-indigo-500">{selected.project_title}</div>}
                  </div>
                </div>
                <span className="text-xs text-gray-400 capitalize">{selected.other_user_role}</span>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {loadingMsgs ? (
                  <div className="text-sm text-gray-400 text-center">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center">No messages yet. Say hello!</div>
                ) : messages.map(msg => {
                  const mine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!mine && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-semibold text-indigo-600 flex-shrink-0">
                          {initials(msg.sender_name)}
                        </div>
                      )}
                      <div className={`max-w-[55%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 ${mine ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {fmt(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typingUsers.size > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="bg-gray-100 rounded-full px-3 py-2 flex gap-1">
                      {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="px-5 py-3.5 border-t border-gray-200 flex items-center gap-3">
                <input value={input} onChange={e => { setInput(e.target.value); e.target.value ? startTyping() : stopTyping(); }}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={`Message ${selected.other_user_name}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
                <button onClick={handleSend} disabled={!input.trim()}
                  className="px-4 py-2.5 bg-indigo-700 text-white rounded-xl text-sm font-medium hover:bg-indigo-800 disabled:opacity-50 flex items-center gap-1.5">
                  <Send size={14} /> Send
                </button>
              </div>
            </>
          )}
        </div>

        {selected && (
          <div className="w-44 border-l border-gray-200 px-4 py-4 flex-shrink-0">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Project</div>
            <div className="text-sm font-medium text-gray-900 mb-4">{selected.project_title || '—'}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Role</div>
            <div className="text-sm text-gray-600 capitalize mb-4">{selected.other_user_role}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MY TEAM ──────────────────────────────────────────────────────────────────
export function MyTeam() {
  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My team</h1>
      <p className="text-sm text-gray-500 mb-8">Experts and students working with you across projects.</p>
      <div className="border border-gray-200 rounded-xl px-5 py-10 text-center text-sm text-gray-400">
        Team members appear here once a project is assigned.
      </div>
    </div>
  );
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────
const invStyle = { released: 'text-green-700', pending: 'text-amber-600', cancelled: 'text-gray-400' };

export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ paid: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    getClientInvoices()
      .then(res => {
        const data = res.data || [];
        setInvoices(data);
        setSummary({
          paid: data.filter(i => i.status === 'released').reduce((s, i) => s + Number(i.amount), 0),
          pending: data.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0),
        });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (id) => {
    setPaying(id);
    try {
      await updatePayment(id, { status: 'released' });
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'released' } : i));
      toast.success('Payment released!');
    } catch { toast.error('Payment failed'); }
    finally { setPaying(null); }
  };

  const fmt = n => Number(n).toLocaleString('fr-DZ');

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Invoices</h1>
      <p className="text-sm text-gray-500 mb-6">All billing across your projects.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Paid YTD', value: `${fmt(summary.paid)} DZD` },
          { label: 'Pending payment', value: `${fmt(summary.pending)} DZD` },
          { label: 'Total invoices', value: invoices.length },
          { label: 'Next payout', value: 'Monthly' },
        ].map(s => (
          <div key={s.label} className="border border-gray-200 rounded-xl px-5 py-4">
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_2fr_1fr_1.5fr_1fr_auto] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['REF', 'PROJECT', 'DATE', 'AMOUNT', 'STATUS', ''].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No invoices yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map(inv => (
              <div key={inv.id} className="grid grid-cols-[1fr_2fr_1fr_1.5fr_1fr_auto] items-center px-5 py-4 hover:bg-gray-50">
                <span className="text-xs font-mono text-gray-500">{inv.id?.slice(0, 8)}</span>
                <span className="text-sm font-medium text-gray-900">{inv.project_title || '—'}</span>
                <span className="text-sm text-gray-500">{inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</span>
                <span className="text-sm font-semibold text-gray-900">{fmt(inv.amount)} DZD</span>
                <span className={`text-sm font-medium ${invStyle[inv.status] || 'text-gray-500'}`}>{inv.status}</span>
                {inv.status === 'released'
                  ? <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1"><FileText size={13} /> Receipt</button>
                  : <button onClick={() => handlePay(inv.id)} disabled={paying === inv.id} className="px-3 py-1.5 bg-indigo-700 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 disabled:opacity-60">
                    {paying === inv.id ? '...' : 'Pay'}
                  </button>
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
export function Contracts() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Contracts</h1>
      <p className="text-sm text-gray-500 mb-8">Signed agreements and NDAs. Download PDFs any time.</p>
      <div className="border border-gray-200 rounded-xl px-5 py-10 text-center text-sm text-gray-400">
        Contracts will appear here once projects are signed.
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export function ClientSettings() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [notifs, setNotifs] = useState({ project_update: true, invoice: true, team: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setCompany(user.client?.company || '');
      setContact(`${user.first_name || ''} ${user.last_name || ''}`.trim());
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); toast.success('Settings saved!'); }, 700);
  };

  return (
    <div className="px-8 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Account and notification preferences.</p>
      <div className="border border-gray-200 rounded-xl p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Company name</label>
          <input value={company} onChange={e => setCompany(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact name</label>
            <input value={contact} onChange={e => setContact(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
          {[
            { key: 'project_update', label: 'Project status updates' },
            { key: 'invoice', label: 'New invoices and payment confirmations' },
            { key: 'team', label: 'Team member messages' },
          ].map(n => (
            <label key={n.key} className="flex items-center gap-3 mb-2.5 cursor-pointer">
              <input type="checkbox" checked={notifs[n.key]} onChange={e => setNotifs(x => ({ ...x, [n.key]: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm text-gray-700">{n.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}