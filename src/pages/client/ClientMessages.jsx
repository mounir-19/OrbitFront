import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';

const initials = (name = '') =>
    name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

const fmtTime = iso =>
    iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

export default function ClientMessages() {
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

    // ── Load conversations ─────────────────────────────────────────────────────
    useEffect(() => {
        api.get('/messages/conversations')
            .then(r => setConversations(r.data || []))
            .catch(() => { })
            .finally(() => setLoadingConvs(false));
    }, []);

    // ── Load messages when conversation selected ───────────────────────────────
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

    return (
        <div className="h-full flex flex-col bg-[#fafafa] px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Messages</h1>
                <span className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${connected ? 'text-green-500' : 'text-[#9ca3af]'}`}>
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-[#d1d5db]'}`} />
                    {connected ? 'Live' : 'Connecting...'}
                </span>
            </div>
            <p className="text-sm text-[#6b7280] mb-6">Chat directly with your expert and project team.</p>

            {/* Chat container */}
            <div className="flex-1 bg-white rounded-2xl border border-[#ede9fe] overflow-hidden flex min-h-0">

                {/* Conversation list */}
                <div className="w-72 border-r border-[#ede9fe] flex-shrink-0 flex flex-col">
                    <div className="px-5 py-4 border-b border-[#ede9fe]">
                        <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">
                            Conversations
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loadingConvs ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                <div className="w-10 h-10 rounded-2xl bg-[#f5f3ff] flex items-center justify-center mb-3">
                                    <MessageSquare size={18} className="text-[#7c3aed]" />
                                </div>
                                <div className="text-[12px] text-[#9ca3af]">No conversations yet.</div>
                            </div>
                        ) : conversations.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelected(c)}
                                className={`w-full text-left px-5 py-4 border-b border-[#f5f3ff] transition-colors ${selected?.id === c.id
                                        ? 'bg-[#f5f3ff] border-l-2 border-l-[#7c3aed]'
                                        : 'hover:bg-[#fafafa]'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#ede9fe] flex items-center justify-center text-xs font-bold text-[#7c3aed] flex-shrink-0">
                                        {initials(c.other_user_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[13px] font-semibold text-[#111827] truncate">{c.other_user_name}</span>
                                            <span className="text-[10px] text-[#9ca3af] flex-shrink-0 ml-2">{fmtTime(c.last_message_at)}</span>
                                        </div>
                                        {c.project_title && (
                                            <div className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest mb-0.5 truncate">
                                                {c.project_title}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] text-[#9ca3af] truncate">
                                                {c.last_message || 'No messages yet'}
                                            </span>
                                            {Number(c.unread) > 0 && (
                                                <span className="w-4 h-4 rounded-full bg-[#7c3aed] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">
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

                {/* Chat panel */}
                <div className="flex-1 flex flex-col min-w-0">
                    {!selected ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-[#f5f3ff] flex items-center justify-center mb-3">
                                <MessageSquare size={22} className="text-[#7c3aed]" />
                            </div>
                            <div className="text-sm font-semibold text-[#374151] mb-1">Select a conversation</div>
                            <div className="text-[12px] text-[#9ca3af]">Choose from the list to start chatting.</div>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="px-6 py-4 border-b border-[#ede9fe] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#ede9fe] flex items-center justify-center text-xs font-bold text-[#7c3aed]">
                                        {initials(selected.other_user_name)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-[#111827]">{selected.other_user_name}</div>
                                        {selected.project_title && (
                                            <div className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest">
                                                {selected.project_title}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest capitalize">
                                    {selected.other_user_role}
                                </span>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
                                {loadingMsgs ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-2/3" />)}
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-[12px] text-[#9ca3af]">
                                        No messages yet. Say hello!
                                    </div>
                                ) : messages.map(msg => {
                                    const mine = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                            {!mine && (
                                                <div className="w-7 h-7 rounded-xl bg-[#ede9fe] flex items-center justify-center text-[10px] font-bold text-[#7c3aed] flex-shrink-0">
                                                    {initials(msg.sender_name)}
                                                </div>
                                            )}
                                            <div className={`max-w-[55%] rounded-2xl px-4 py-2.5 text-sm ${mine
                                                    ? 'bg-[#7c3aed] text-white rounded-br-md'
                                                    : 'bg-[#f5f3ff] text-[#111827] rounded-bl-md'
                                                }`}>
                                                {msg.content}
                                                <div className={`text-[10px] mt-1 ${mine ? 'text-[#c4b5fd]' : 'text-[#9ca3af]'}`}>
                                                    {fmtTime(msg.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {typingUsers.size > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="bg-[#f5f3ff] rounded-2xl px-4 py-2.5 flex gap-1">
                                            {[0, 150, 300].map(d => (
                                                <span key={d} className="w-1.5 h-1.5 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="px-6 py-4 border-t border-[#ede9fe] flex items-center gap-3">
                                <input
                                    value={input}
                                    onChange={e => { setInput(e.target.value); e.target.value ? startTyping() : stopTyping(); }}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder={`Message ${selected.other_user_name}...`}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#ede9fe] text-sm text-[#111827] outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#f5f3ff] transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="px-4 py-2.5 bg-[#7c3aed] text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-[#6d28d9] transition-colors"
                                >
                                    <Send size={14} /> Send
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Right panel */}
                {selected && (
                    <div className="w-44 border-l border-[#ede9fe] px-4 py-5 flex-shrink-0">
                        <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Project</div>
                        <div className="text-[13px] font-semibold text-[#111827] mb-4 leading-snug">{selected.project_title || '—'}</div>
                        <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Role</div>
                        <div className="text-[13px] text-[#6b7280] capitalize">{selected.other_user_role}</div>
                    </div>
                )}
            </div>
        </div>
    );
}