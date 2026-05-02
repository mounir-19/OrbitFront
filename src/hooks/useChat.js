import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Singleton socket — one connection for the whole app
let _socket = null;

function getSocket(token) {
    if (!_socket || _socket.disconnected) {
        _socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });
    }
    return _socket;
}

/**
 * useChat({ conversationId? })
 *
 * Provides:
 *   messages        – current message array
 *   sendMessage(content)
 *   startTyping() / stopTyping()
 *   typingUsers     – Set of userIds currently typing
 *   connected       – boolean
 *   openConversation(otherUserId, projectId?) → resolves to conversationId
 */
export function useChat({ conversationId: initialConvId } = {}) {
    const { token, user } = useAuthStore();
    const socketRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [connected, setConnected] = useState(false);
    const [convId, setConvId] = useState(initialConvId || null);

    const typingTimer = useRef(null);

    // ── Connect once ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        const socket = getSocket(token);
        socketRef.current = socket;

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        if (socket.connected) setConnected(true);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [token]);

    // ── Join / leave conversation room ─────────────────────────────────────────
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !convId) return;

        socket.emit('conversation:join', { conversationId: convId });

        const onNewMessage = (msg) => {
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };

        const onTypingStart = ({ userId }) => {
            if (userId === user?.id) return;
            setTypingUsers(s => new Set([...s, userId]));
        };
        const onTypingStop = ({ userId }) => {
            setTypingUsers(s => { const n = new Set(s); n.delete(userId); return n; });
        };

        socket.on('message:new', onNewMessage);
        socket.on('typing:start', onTypingStart);
        socket.on('typing:stop', onTypingStop);

        return () => {
            socket.emit('conversation:leave', { conversationId: convId });
            socket.off('message:new', onNewMessage);
            socket.off('typing:start', onTypingStart);
            socket.off('typing:stop', onTypingStop);
        };
    }, [convId, user?.id]);

    // ── Actions ────────────────────────────────────────────────────────────────
    const sendMessage = useCallback((content) => {
        if (!socketRef.current || !convId || !content.trim()) return;
        socketRef.current.emit('message:send', { conversationId: convId, content });
        stopTyping();
    }, [convId]);

    const startTyping = useCallback(() => {
        if (!socketRef.current || !convId) return;
        socketRef.current.emit('typing:start', { conversationId: convId });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(stopTyping, 3000);
    }, [convId]);

    const stopTyping = useCallback(() => {
        clearTimeout(typingTimer.current);
        if (!socketRef.current || !convId) return;
        socketRef.current.emit('typing:stop', { conversationId: convId });
    }, [convId]);

    /**
     * Start or retrieve a conversation with another user.
     * Returns a promise that resolves to the conversationId.
     */
    const openConversation = useCallback((otherUserId, projectId = null) => {
        return new Promise((resolve, reject) => {
            const socket = socketRef.current;
            if (!socket) return reject(new Error('Socket not connected'));

            socket.once('conversation:ready', ({ conversationId }) => {
                setConvId(conversationId);
                resolve(conversationId);
            });
            socket.emit('conversation:start', { otherUserId, projectId });
        });
    }, []);

    return {
        messages,
        setMessages, 
        sendMessage,
        startTyping,
        stopTyping,
        typingUsers,
        connected,
        convId,
        setConvId,
        openConversation,
        socket: socketRef.current,
    };
}