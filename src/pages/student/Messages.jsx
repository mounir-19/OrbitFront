import { useState, useEffect, useRef } from 'react';
import { Send, Wifi, WifiOff } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function Messages() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);

  const {
    messages, setMessages, sendMessage,
    startTyping, stopTyping, typingUsers,
    connected, setConvId,
  } = useChat({ conversationId: selected?.id });

  // Load conversation list
  useEffect(() => {
    api.get('/messages/conversations')
      .then(r => setConversations(r.data || []))
      .catch(() => { })
      .finally(() => setLoadingConvs(false));
  }, []);

  // Load history when selected changes
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !selected) return;
    sendMessage(input);
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value) startTyping(); else stopTyping();
  };

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="px-8 py-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {connected
            ? <><Wifi size={13} className="text-green-500" /> Live</>
            : <><WifiOff size={13} className="text-red-400" /> Reconnecting...</>
          }
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Talk to your expert, teammates, and cohort.</p>

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
                  {c.project_title && <div className="text-xs text-indigo-500 mb-0.5">{c.project_title}</div>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 truncate">{c.last_message || 'No messages yet'}</span>
                    {Number(c.unread) > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 ml-1">
                        {c.unread}
                      </span>
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
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="px-5 py-3.5 border-b border-gray-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">
                  {initials(selected.other_user_name)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{selected.other_user_name}</div>
                  {selected.project_title && <div className="text-xs text-indigo-500">{selected.project_title}</div>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {loadingMsgs ? (
                  <div className="text-sm text-gray-400 text-center">Loading...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center">No messages yet.</div>
                ) : messages.map(msg => {
                  const mine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!mine && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-semibold text-indigo-600 flex-shrink-0">
                          {initials(msg.sender_name)}
                        </div>
                      )}
                      <div className={`max-w-[60%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
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
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="px-5 py-3.5 border-t border-gray-200 flex items-center gap-3">
                <input value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={`Message ${selected.other_user_name}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
                <button onClick={handleSend} disabled={!input.trim()}
                  className="px-4 py-2.5 bg-indigo-700 text-white rounded-xl text-sm font-medium hover:bg-indigo-800 disabled:opacity-50 flex items-center gap-1.5">
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right info panel */}
        {selected && (
          <div className="w-44 border-l border-gray-200 px-4 py-4 flex-shrink-0">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Project</div>
            <div className="text-sm font-medium text-gray-900 mb-4">{selected.project_title || '—'}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role</div>
            <div className="text-sm text-gray-600 capitalize">{selected.other_user_role}</div>
          </div>
        )}
      </div>
    </div>
  );
}