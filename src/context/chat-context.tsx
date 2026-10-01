import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

import { useAuth } from '@/context/auth-context';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import * as chatApi from '@/services/chat-api';
import type { AttachmentType, ChatMessage, ConversationItem } from '@/services/chat-api';

/** Events forwarded to an open thread screen. */
export type ThreadEvent =
  | { type: 'new'; message: ChatMessage }
  | { type: 'read'; conversationId: string; readerId: string; readAt: string }
  | { type: 'deleted'; conversationId: string; messageId: string }
  | { type: 'reconnected' };

type Ack = { status?: number; message?: string; data?: ChatMessage };

type SendInput = {
  receiverId: string;
  text?: string;
  attachment?: { url: string; type: AttachmentType };
};

type ChatContextValue = {
  conversations: ConversationItem[];
  isLoadingConversations: boolean;
  totalUnread: number;
  currentUserId: string | null;
  refreshConversations: () => Promise<void>;
  isOnline: (userId: string) => boolean;
  isTyping: (userId: string) => boolean;
  /** The thread screen registers the conversation it shows so it isn't counted as unread. */
  setActiveConversation: (conversationId: string | null) => void;
  subscribe: (listener: (event: ThreadEvent) => void) => () => void;
  sendMessage: (input: SendInput) => Promise<ChatMessage>;
  emitTyping: (receiverId: string, isTyping: boolean) => void;
  markRead: (conversationId: string) => void;
  unsendMessage: (messageId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  removeConversationLocally: (conversationId: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const currentUserId = useCurrentUserId();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef(new Set<(event: ThreadEvent) => void>());
  const activeConversationRef = useRef<string | null>(null);
  const meRef = useRef<string | null>(null);

  useEffect(() => {
    meRef.current = currentUserId;
  }, [currentUserId]);

  const emit = (event: ThreadEvent) => listenersRef.current.forEach((listener) => listener(event));

  const refreshConversations = useCallback(async () => {
    if (!token) return;
    try {
      setConversations(await chatApi.getConversations(token));
    } catch {
      // Keep the current list on a transient failure.
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token]);

  // Socket lifecycle: connect while signed in (website chat-socket.ts), auth via `auth.token`.
  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on sign-in
    refreshConversations();

    const socket = io(chatApi.CHAT_SOCKET_URL, {
      auth: { token },
      // Same as the website: a direct websocket handshake fails on production, polling-then-upgrade works.
      transports: ['polling', 'websocket'],
    });
    socketRef.current = socket;
    let connectedOnce = false;

    socket.on('connect', () => {
      // On every reconnect after the first, re-sync over REST (website behaviour).
      if (connectedOnce) {
        refreshConversations();
        emit({ type: 'reconnected' });
      }
      connectedOnce = true;
    });

    socket.on('message:new', (message: ChatMessage) => {
      const mine = message.sender_id === meRef.current;
      const isActive = activeConversationRef.current === message.conversation_id;
      let known = false;
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.conversation_id === message.conversation_id);
        if (index === -1) return prev;
        known = true;
        const current = prev[index];
        const updated: ConversationItem = {
          ...current,
          last_message: chatApi.messagePreview(message),
          last_message_at: message.created_at,
          last_message_is_mine: mine,
          unread_count: !mine && !isActive ? current.unread_count + 1 : current.unread_count,
        };
        return [updated, ...prev.slice(0, index), ...prev.slice(index + 1)];
      });
      if (!known) refreshConversations();
      emit({ type: 'new', message });
    });

    socket.on('message:read', (payload: { conversation_id: string; reader_id: string; read_at: string }) => {
      emit({ type: 'read', conversationId: payload.conversation_id, readerId: payload.reader_id, readAt: payload.read_at });
    });

    socket.on('message:deleted', (payload: { message_id: string; conversation_id: string }) => {
      emit({ type: 'deleted', conversationId: payload.conversation_id, messageId: payload.message_id });
      refreshConversations();
    });

    socket.on('message:typing', (payload: { sender_id: string; is_typing: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (payload.is_typing) next.add(payload.sender_id);
        else next.delete(payload.sender_id);
        return next;
      });
    });

    socket.on('presence:bulk', (list: { user_id: string; online: boolean }[]) => {
      setOnlineUsers(new Set(list.filter((p) => p.online).map((p) => p.user_id)));
    });

    socket.on('presence:update', (payload: { user_id: string; online: boolean }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (payload.online) next.add(payload.user_id);
        else next.delete(payload.user_id);
        return next;
      });
    });

    socket.on('conversation:deleted', (payload: { conversation_id: string }) => {
      setConversations((prev) => prev.filter((c) => c.conversation_id !== payload.conversation_id));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconnect only when the token changes
  }, [token]);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    activeConversationRef.current = conversationId;
    if (conversationId) {
      setConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c))
      );
    }
  }, []);

  const subscribe = useCallback((listener: (event: ThreadEvent) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  /** Socket first with ack; REST fallback if the socket is down or the ack isn't 200 (website logic). */
  const sendMessage = useCallback(
    async ({ receiverId, text, attachment }: SendInput): Promise<ChatMessage> => {
      if (!token) throw new Error('Please sign in to continue.');
      const payload = {
        receiver_id: receiverId,
        ...(text ? { message: text } : {}),
        ...(attachment ? { attachment_url: attachment.url, attachment_type: attachment.type } : {}),
      };
      const socket = socketRef.current;
      if (socket?.connected) {
        const ack = await new Promise<Ack | null>((resolve) => {
          const timer = setTimeout(() => resolve(null), 8000);
          socket.emit('message:send', payload, (response: Ack) => {
            clearTimeout(timer);
            resolve(response);
          });
        });
        if (ack?.status === 200 && ack.data) return ack.data;
        // A 201 is a business rule (blocked, private, profanity) — REST would fail the same way.
        if (ack && ack.status !== 200) throw new Error(ack.message || 'Unable to send message.');
      }
      const sent = await chatApi.sendMessageRest(token, payload);
      refreshConversations();
      return { ...sent, sender_id: meRef.current ?? '', receiver_id: receiverId };
    },
    [token, refreshConversations]
  );

  const emitTyping = useCallback((receiverId: string, isTyping: boolean) => {
    socketRef.current?.emit('message:typing', { receiver_id: receiverId, is_typing: isTyping });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('message:read', { conversation_id: conversationId }, () => {});
  }, []);

  const unsendMessage = useCallback(
    async (messageId: string) => {
      if (!token) return;
      const socket = socketRef.current;
      if (socket?.connected) {
        const ack = await new Promise<Ack | null>((resolve) => {
          const timer = setTimeout(() => resolve(null), 8000);
          socket.emit('message:delete', { message_id: messageId }, (response: Ack) => {
            clearTimeout(timer);
            resolve(response);
          });
        });
        if (ack?.status === 200) return;
        if (ack) throw new Error(ack.message || 'Unable to unsend message.');
      }
      await chatApi.deleteMessageRest(token, messageId);
    },
    [token]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!token) return;
      await chatApi.deleteConversation(token, conversationId);
      setConversations((prev) => prev.filter((c) => c.conversation_id !== conversationId));
    },
    [token]
  );

  const removeConversationLocally = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.conversation_id !== conversationId));
  }, []);

  // Signed out → nothing to show, without clearing state inside an effect.
  const visibleConversations = useMemo(() => (token ? conversations : []), [token, conversations]);

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations: visibleConversations,
      isLoadingConversations,
      totalUnread: visibleConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
      currentUserId,
      refreshConversations,
      isOnline: (userId: string) => onlineUsers.has(userId),
      isTyping: (userId: string) => typingUsers.has(userId),
      setActiveConversation,
      subscribe,
      sendMessage,
      emitTyping,
      markRead,
      unsendMessage,
      deleteConversation,
      removeConversationLocally,
    }),
    [
      visibleConversations,
      isLoadingConversations,
      currentUserId,
      refreshConversations,
      onlineUsers,
      typingUsers,
      setActiveConversation,
      subscribe,
      sendMessage,
      emitTyping,
      markRead,
      unsendMessage,
      deleteConversation,
      removeConversationLocally,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
