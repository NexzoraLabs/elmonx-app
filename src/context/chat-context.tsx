import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

import { useAuth } from '@/context/auth-context';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import * as chatApi from '@/services/chat-api';
import type { AttachmentType, ChatMessage, ConversationItem } from '@/services/chat-api';
import i18n from '@/i18n';
import { bumpUnreadNotifications } from '@/services/unread-notifications';

/** Events forwarded to an open thread screen. */
export type ThreadEvent =
  | { type: 'new'; message: ChatMessage }
  | { type: 'read'; conversationId: string; readerId: string; readAt: string }
  | { type: 'deleted'; conversationId: string; messageId: string }
  | { type: 'reconnected' };

type Ack = { status?: number; message?: string; data?: ChatMessage };

/** `auction:extended` — anti-sniping moved the end time (backend sockets/index.js). */
export type AuctionExtendedEvent = { auction_id: string; end_time: string };

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
  /** The thread screen registers the conversation it shows so it isn't counted as unread. */
  setActiveConversation: (conversationId: string | null) => void;
  subscribe: (listener: (event: ThreadEvent) => void) => () => void;
  sendMessage: (input: SendInput) => Promise<ChatMessage>;
  emitTyping: (receiverId: string, isTyping: boolean) => void;
  markRead: (conversationId: string) => void;
  unsendMessage: (messageId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  removeConversationLocally: (conversationId: string) => void;
  /** Joins the auction's socket room (website watchAuction); returns the unsubscribe. */
  watchAuction: (auctionId: string, onExtended: (event: AuctionExtendedEvent) => void) => () => void;
};

type ChatPresenceValue = {
  isOnline: (userId: string) => boolean;
  isTyping: (userId: string) => boolean;
};

const ChatContext = createContext<ChatContextValue | null>(null);
// Presence/typing change constantly; a context of their own keeps those updates from re-rendering
// every chat consumer (tab badge, profile, new-chat screen).
const ChatPresenceContext = createContext<ChatPresenceValue | null>(null);

/**
 * Chat state belongs to one account: keyed by the user so signing in as someone else starts from
 * an empty list (no flash of the previous person's conversations, unread badge or presence).
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <ChatSession key={user?.user_name ?? 'signed-out'}>{children}</ChatSession>;
}

// A "typing…" whose stop event got lost (dropped socket, app killed) clears itself after this.
const TYPING_TIMEOUT_MS = 6000;

function ChatSession({ children }: { children: ReactNode }) {
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
  const conversationsRef = useRef<ConversationItem[]>([]);
  const typingTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const auctionWatchersRef = useRef(new Map<string, Set<(event: AuctionExtendedEvent) => void>>());

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

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
      // Rooms don't survive a reconnect: re-join every auction page that is open.
      auctionWatchersRef.current.forEach((_, auctionId) => socket.emit('auction:watch', auctionId));
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
      // Decided from the latest rendered list: a state updater isn't guaranteed to run right away,
      // so a flag set inside it made every message trigger a full REST refresh.
      const known = conversationsRef.current.some((c) => c.conversation_id === message.conversation_id);
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.conversation_id === message.conversation_id);
        if (index === -1) return prev;
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

    const typingTimers = typingTimersRef.current;
    const setTyping = (userId: string, isTyping: boolean) => {
      clearTimeout(typingTimers.get(userId));
      typingTimers.delete(userId);
      if (isTyping) typingTimers.set(userId, setTimeout(() => setTyping(userId, false), TYPING_TIMEOUT_MS));
      setTypingUsers((prev) => {
        if (prev.has(userId) === isTyping) return prev;
        const next = new Set(prev);
        if (isTyping) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('message:typing', (payload: { sender_id: string; is_typing: boolean }) => {
      setTyping(payload.sender_id, payload.is_typing);
    });

    // A new message also means the sender stopped typing.
    socket.on('message:new', (message: ChatMessage) => {
      if (message.sender_id) setTyping(message.sender_id, false);
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

    // Website: the bell counts up live when the server pushes a notification.
    socket.on('notification:new', () => bumpUnreadNotifications());

    socket.on('auction:extended', (payload: AuctionExtendedEvent) => {
      auctionWatchersRef.current.get(payload.auction_id)?.forEach((listener) => listener(payload));
    });

    socket.on('conversation:deleted', (payload: { conversation_id: string }) => {
      setConversations((prev) => prev.filter((c) => c.conversation_id !== payload.conversation_id));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      typingTimers.forEach(clearTimeout);
      typingTimers.clear();
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
      if (!token) throw new Error(i18n.t('Please sign in to continue.'));
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
        if (ack && ack.status !== 200) throw new Error(ack.message || i18n.t('Unable to send message.'));
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
        if (ack) throw new Error(ack.message || i18n.t('Unable to unsend message.'));
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

  const watchAuction = useCallback((auctionId: string, onExtended: (event: AuctionExtendedEvent) => void) => {
    const watchers = auctionWatchersRef.current;
    let listeners = watchers.get(auctionId);
    if (!listeners) {
      listeners = new Set();
      watchers.set(auctionId, listeners);
      if (socketRef.current?.connected) socketRef.current.emit('auction:watch', auctionId);
    }
    listeners.add(onExtended);
    return () => {
      const current = watchers.get(auctionId);
      current?.delete(onExtended);
      if (current && current.size === 0) {
        watchers.delete(auctionId);
        socketRef.current?.emit('auction:unwatch', auctionId);
      }
    };
  }, []);

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
      setActiveConversation,
      subscribe,
      sendMessage,
      emitTyping,
      markRead,
      unsendMessage,
      deleteConversation,
      removeConversationLocally,
      watchAuction,
    }),
    [
      visibleConversations,
      isLoadingConversations,
      currentUserId,
      refreshConversations,
      setActiveConversation,
      subscribe,
      sendMessage,
      emitTyping,
      markRead,
      unsendMessage,
      deleteConversation,
      removeConversationLocally,
      watchAuction,
    ]
  );

  const presence = useMemo<ChatPresenceValue>(
    () => ({
      isOnline: (userId: string) => onlineUsers.has(userId),
      isTyping: (userId: string) => typingUsers.has(userId),
    }),
    [onlineUsers, typingUsers]
  );

  return (
    <ChatContext.Provider value={value}>
      <ChatPresenceContext.Provider value={presence}>{children}</ChatPresenceContext.Provider>
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

/** Online dot + "typing…" for chat rows and the thread header. */
export function useChatPresence() {
  const context = useContext(ChatPresenceContext);
  if (!context) {
    throw new Error('useChatPresence must be used within a ChatProvider');
  }
  return context;
}
