import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, Wifi, WifiOff } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function ExpertChat() {
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
    connected, setConvId, openConversation,
  } = useChat({ conversationId: selected?.id });

  // ── Load conversation list ────────────────────────────────────────────────
  useEffect(() => {
    api.get('/messages/conversations')
      .then(r => setConversations(r.data || []))
      .catch(() => { })
      .finally(() => setLoadingConvs(false));
  }, []);

  // ── Load history when conversation selected ───────────────────────────────
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

  // ── Auto-scroll ───────────────────────────────────────────────────────────
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

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const colorForName = (name = '') => {
    const colors = [
      'bg-indigo-100 text-indigo-700', 'bg-blue-100 text-blue-700',
      'bg-teal-100 text-teal-700', 'bg-pink-100 text-pink-700',
      'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700',
    ];
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
    return colors[h];
  };

  return (
    <div className="px-8 py-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {connected
            ? <><Wifi size={13} className="text-green-500" /> Live</>
            : <><WifiOff size={13} className="text-red-400" /> Reconnecting...</>
          }
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Direct messages with students and clients.</p>

      <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex min-h-0">
        {/* ── Conversation list ──────────────────────────────────────── */}
        <div className="w-72 border-r border-gray-200 flex-shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Conversations</span>
            <span className="text-xs text-gray-400">{conversations.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">No conversations yet.</div>
            ) : conversations.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${colorForName(c.other_user_name)}`}>
                    {getInitials(c.other_user_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-gray-900 truncate">{c.other_user_name}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{formatTime(c.last_message_at)}</span>
                    </div>
                    {c.project_title && <div className="text-xs text-indigo-500 mb-0.5 truncate">{c.project_title}</div>}
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
        </div>

        {/* ── Chat panel ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${colorForName(selected.other_user_name)}`}>
                    {getInitials(selected.other_user_name)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{selected.other_user_name}</div>
                    {selected.project_title && <div className="text-xs text-indigo-500">{selected.project_title}</div>}
                  </div>
                </div>
                <span className="text-xs text-gray-400 capitalize">{selected.other_user_role}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {loadingMsgs ? (
                  <div className="text-sm text-gray-400 text-center py-4">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">No messages yet. Say hello!</div>
                ) : messages.map(msg => {
                  const mine = msg.sender_id === user?.id;
                  // File message
                  if (msg.isFile) {
                    return (
                      <div key={msg.id} className="flex justify-start">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 max-w-xs">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Image size={16} className="text-indigo-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{msg.fileName}</div>
                              <div className="text-xs text-gray-400">{msg.fileSize}</div>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!mine && (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${colorForName(msg.sender_name)}`}>
                          {getInitials(msg.sender_name)}
                        </div>
                      )}
                      <div className={`max-w-[60%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        {!mine && <span className="text-xs font-semibold text-gray-600 mb-0.5">{msg.sender_name}</span>}
                        <div className={`rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                          {msg.content}
                          <div className={`text-[10px] mt-1 ${mine ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-3.5 border-t border-gray-200 flex items-center gap-3">
                <button className="text-gray-400 hover:text-gray-600"><Paperclip size={16} /></button>
                <input value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
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
      </div>
    </div>
  );
}