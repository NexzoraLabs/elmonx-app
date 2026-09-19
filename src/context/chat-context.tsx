import { createContext, useContext, useState, type ReactNode } from 'react';

import { INITIAL_CONVERSATIONS, type Conversation } from '@/data/chat-mock';

type ChatContextValue = {
  conversations: Conversation[];
  getConversation: (id: string) => Conversation | undefined;
  sendMessage: (id: string, text: string) => void;
  blockConversation: (id: string) => void;
  unblockConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  acceptRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);

  const getConversation = (id: string) => conversations.find((conversation) => conversation.id === id);

  const sendMessage = (id: string, text: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                { id: `${id}-${Date.now()}`, fromMe: true, text, timestamp: 'Just now' },
              ],
              lastMessagePreview: text,
              lastMessageIsImage: false,
              lastMessageRead: false,
              unreadCount: 0,
            }
          : conversation
      )
    );
  };

  const blockConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id ? { ...conversation, isBlocked: true } : conversation
      )
    );
  };

  const unblockConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id ? { ...conversation, isBlocked: false } : conversation
      )
    );
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
  };

  const acceptRequest = (id: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id ? { ...conversation, isRequest: false } : conversation
      )
    );
  };

  const rejectRequest = (id: string) => {
    setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        getConversation,
        sendMessage,
        blockConversation,
        unblockConversation,
        deleteConversation,
        acceptRequest,
        rejectRequest,
      }}>
      {children}
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
