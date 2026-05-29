import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Trash2, FileText, Download } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from 'react-router-dom';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export default function ExpertChat() {
  const { user } = useAuthStore();
  const location = useLocation();
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const menuRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    messages, setMessages, sendMessage,
    startTyping, stopTyping, typingUsers,
    connected, setConvId, socket,
  } = useChat({ conversationId: selected?.id });

  // ── Load conversations ────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/messages/conversations')
      .then(r => {
        const convs = r.data || [];
        setConversations(convs);
        // Deep-link: navigate('/expert/chat', { state: { conversationId: '...' } })
        if (location.state?.conversationId) {
          const conv = convs.find(c => c.id === location.state.conversationId);
          if (conv) setSelected(conv);
        }
      })
      .catch(() => { })
      .finally(() => setLoadingConvs(false));
  }, [location.state]);

  // ── Load messages when conversation selected ──────────────────────────────
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

  // ── Join all conversation rooms so sidebar updates for every thread ───────
  useEffect(() => {
    if (!conversations.length || !socket) return;
    conversations.forEach(c => socket.emit('conversation:join', { conversationId: c.id }));
  }, [conversations, socket]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Real-time sidebar updates for ALL conversations ───────────────────────
  useEffect(() => {
    if (!socket) return;
    const onAnyMessage = (msg) => {
      // If it's the active conversation the hook already appended the msg —
      // we only need to bump the sidebar. For other convs increment unread.
      const isActive = msg.conversation_id === selected?.id;
      setConversations(prev =>
        bumpConv(prev, msg.conversation_id, msg.content, msg.created_at, !isActive)
      );
    };
    socket.on('message:new', onAnyMessage);
    return () => socket.off('message:new', onAnyMessage);
  }, [socket, selected?.id]);

  // ── Close 3-dots menu on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Move a conversation to the top of the list and update its preview fields.
   * incrementUnread=true when the message is from another conversation.
   */
  const bumpConv = (prev, convId, content, at, incrementUnread = false) => {
    const updated = prev.map(c =>
      c.id === convId
        ? {
          ...c,
          last_message: content,
          last_message_at: at,
          unread: incrementUnread ? (Number(c.unread) || 0) + 1 : c.unread,
        }
        : c
    );
    const idx = updated.findIndex(c => c.id === convId);
    if (idx > 0) {
      const [conv] = updated.splice(idx, 1);
      return [conv, ...updated];
    }
    return updated;
  };

  const handleSend = () => {
    if (!input.trim() || !selected) return;
    const content = input;
    sendMessage(content);
    // Optimistically bump sidebar so the last_message preview updates instantly
    setConversations(prev => bumpConv(prev, selected.id, content, new Date().toISOString()));
    setInput('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    e.target.value = '';
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(
        `/messages/conversations/${selected.id}/file`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const msg = res.data;
      // Guard against duplicate if socket also delivers it
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      setConversations(prev =>
        bumpConv(prev, selected.id, `📎 ${file.name}`, msg.created_at)
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selected) return;
    setMenuOpen(false);
    try {
      await api.delete(`/messages/conversations/${selected.id}`);
      setConversations(prev => prev.filter(c => c.id !== selected.id));
      setSelected(null);
      setMessages([]);
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value) startTyping(); else stopTyping();
  };

  const handleSelect = (conv) => {
    // Clear unread badge immediately on selection
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c)
    );
    setSelected(conv);
    setMenuOpen(false);
  };

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const filteredConversations = conversations.filter(c =>
    c.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-8 py-8 h-full flex flex-col">
      <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex min-h-0 bg-white">

        {/* ── Conversation list ─────────────────────────────────────────────── */}
        <div className="w-80 border-r border-gray-200 flex-shrink-0 overflow-y-auto flex flex-col">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {loadingConvs ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">No conversations found</div>
          ) : filteredConversations.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors
                ${selected?.id === c.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0">
                  {initials(c.other_user_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-gray-900 truncate">{c.other_user_name}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{fmt(c.last_message_at)}</span>
                  </div>
                  {c.project_title && (
                    <div className="text-[11px] text-indigo-500 mb-0.5 truncate">{c.project_title}</div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 truncate">{c.last_message || ''}</span>
                    {Number(c.unread) > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ml-2">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Chat panel ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                    {initials(selected.other_user_name)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{selected.other_user_name}</div>
                    {selected.project_title && (
                      <div className="text-xs text-indigo-500">{selected.project_title}</div>
                    )}
                  </div>
                </div>

                {/* 3-dots menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(v => !v)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
                  >
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[160px]">
                      <button
                        onClick={handleDeleteConversation}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete conversation
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 bg-gray-50">
                {loadingMsgs ? (
                  <div className="text-sm text-gray-400 text-center">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center">No messages yet</div>
                ) : messages.map(msg => {
                  const mine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!mine && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-semibold text-indigo-700 flex-shrink-0">
                          {initials(msg.sender_name)}
                        </div>
                      )}
                      <div className="flex flex-col max-w-[60%]">
                        {!mine && (
                          <span className="text-xs font-medium text-gray-500 mb-1 px-1">
                            {msg.sender_name?.toUpperCase()}
                          </span>
                        )}
                        {/* File message — image vs document */}
                        {msg.file_url ? (
                          <div className={`rounded-2xl overflow-hidden border ${mine ? 'border-indigo-400' : 'border-gray-200'}`}>
                            {msg.file_type === 'image' ? (
                              <img
                                src={msg.file_url}
                                alt={msg.file_name}
                                className="max-w-[240px] max-h-[200px] object-cover cursor-pointer"
                                onClick={() => window.open(msg.file_url, '_blank')}
                              />
                            ) : (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 px-4 py-3 ${mine ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                              >
                                <FileText size={18} className="flex-shrink-0" />
                                <span className="text-sm font-medium truncate max-w-[150px]">
                                  {msg.file_name || 'File'}
                                </span>
                                <Download size={14} className="flex-shrink-0 ml-auto" />
                              </a>
                            )}
                          </div>
                        ) : (
                          /* Text message */
                          <div className={`rounded-2xl px-4 py-2.5 text-sm
                            ${mine
                              ? 'bg-indigo-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'}`}
                          >
                            {msg.content}
                          </div>
                        )}
                        <div className={`text-[10px] mt-1 px-1 ${mine ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                          {fmt(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="bg-white rounded-full px-4 py-2.5 flex gap-1 border border-gray-200">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white">
                {uploading && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                    <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Uploading file...
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Paperclip size={18} className="text-gray-400" />
                  </button>
                  <input
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}