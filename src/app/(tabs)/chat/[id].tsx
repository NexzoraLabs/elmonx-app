import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlockUserSheet } from '@/components/chat/block-user-sheet';
import { BlockedFooter } from '@/components/chat/blocked-footer';
import { ChatOptionsSheet } from '@/components/chat/chat-options-sheet';
import { ConversationHeader } from '@/components/chat/conversation-header';
import { DeleteConversationSheet } from '@/components/chat/delete-conversation-sheet';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageContextMenu } from '@/components/chat/message-context-menu';
import { MessageInputBar, type PickedImage } from '@/components/chat/message-input-bar';
import { NewConversationProfileCard } from '@/components/chat/new-conversation-profile-card';
import { UnblockUserSheet } from '@/components/chat/unblock-user-sheet';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import * as chatApi from '@/services/chat-api';
import type { CanMessageReason, ChatMessage } from '@/services/chat-api';
import * as feedApi from '@/services/feed-api';
import { resolveAvatar } from '@/services/profile-api';

function upsertMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  if (list.some((m) => m._id === message._id)) {
    return list.map((m) => (m._id === message._id ? { ...m, ...message } : m));
  }
  return [...list, message].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

function formatSeen(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ id: string; userId: string; username: string; avatar?: string }>();
  const otherUserId = params.userId;
  const username = params.username ?? '';
  const avatarUrl = resolveAvatar(params.avatar);

  const { token } = useAuth();
  const {
    currentUserId,
    isOnline,
    isTyping,
    setActiveConversation,
    subscribe,
    sendMessage,
    emitTyping,
    markRead,
    unsendMessage,
    deleteConversation,
    removeConversationLocally,
    refreshConversations,
  } = useChat();

  const [conversationId, setConversationId] = useState<string | null>(params.id && params.id !== 'new' ? params.id : null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(conversationId));
  const [block, setBlock] = useState({ is_blocked: false, is_blocked_by: false });
  const [canMessage, setCanMessage] = useState<{ can_message: boolean; reason: CanMessageReason }>({
    can_message: true,
    reason: null,
  });

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [blockVisible, setBlockVisible] = useState(false);
  const [unblockVisible, setUnblockVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [menuMessage, setMenuMessage] = useState<ChatMessage | null>(null);

  const loadThread = useCallback(async () => {
    if (!token || !conversationId) return;
    try {
      // Fetching the thread also marks it read on the server.
      setMessages(await chatApi.getThread(token, conversationId));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Unable to load messages.');
    } finally {
      setIsLoading(false);
    }
  }, [token, conversationId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadThread();
  }, [loadThread]);

  const loadRelationship = useCallback(async () => {
    if (!token || !otherUserId) return;
    const [blockStatus, permission] = await Promise.all([
      feedApi.getBlockStatus(token, otherUserId).catch(() => ({ is_blocked: false, is_blocked_by: false })),
      chatApi.canMessageUser(token, otherUserId).catch(() => ({ can_message: true, reason: null as CanMessageReason })),
    ]);
    setBlock(blockStatus);
    setCanMessage(permission);
  }, [token, otherUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadRelationship();
  }, [loadRelationship]);

  // While this thread is open it doesn't count as unread.
  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  // Stop "typing…" on the other side when leaving.
  useEffect(
    () => () => {
      if (otherUserId) emitTyping(otherUserId, false);
    },
    [otherUserId, emitTyping]
  );

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === 'reconnected') {
          loadThread();
          return;
        }
        if (event.type === 'new') {
          const message = event.message;
          const belongs = conversationId
            ? message.conversation_id === conversationId
            : message.sender_id === otherUserId || message.receiver_id === otherUserId;
          if (!belongs) return;
          if (!conversationId && message.conversation_id) setConversationId(message.conversation_id);
          setMessages((prev) => upsertMessage(prev, message));
          // Website: an incoming message in the open thread is marked read straight away.
          if (message.sender_id === otherUserId && message.conversation_id) markRead(message.conversation_id);
          return;
        }
        if (event.conversationId !== conversationId) return;
        if (event.type === 'read' && event.readerId === otherUserId) {
          setMessages((prev) =>
            prev.map((m) => (m.sender_id !== otherUserId && !m.is_read ? { ...m, is_read: true, read_at: event.readAt } : m))
          );
        }
        if (event.type === 'deleted') {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === event.messageId ? { ...m, is_deleted: true, message: null, attachment_url: null } : m
            )
          );
        }
      }),
    [subscribe, conversationId, otherUserId, markRead, loadThread]
  );

  const handleSend = async ({ text, image }: { text: string; image: PickedImage | null }): Promise<boolean> => {
    if (!token || !otherUserId) return false;
    try {
      let attachment: { url: string; type: chatApi.AttachmentType } | undefined;
      if (image) {
        const uploaded = await chatApi.uploadChatImage(token, image);
        attachment = { url: uploaded.attachment_url, type: uploaded.attachment_type };
      }
      const sent = await sendMessage({ receiverId: otherUserId, text: text || undefined, attachment });
      const full: ChatMessage = { ...sent, sender_id: sent.sender_id || currentUserId || '', is_read: sent.is_read ?? false };
      if (!conversationId && full.conversation_id) setConversationId(full.conversation_id);
      setMessages((prev) => upsertMessage(prev, full));
      return true;
    } catch (e) {
      Alert.alert('Message not sent', e instanceof Error ? e.message : 'Please try again.');
      return false;
    }
  };

  const handleUnsend = (message: ChatMessage) => {
    Alert.alert('Unsend message?', 'This message will be removed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unsend',
        style: 'destructive',
        onPress: async () => {
          try {
            await unsendMessage(message._id);
            setMessages((prev) =>
              prev.map((m) => (m._id === message._id ? { ...m, is_deleted: true, message: null, attachment_url: null } : m))
            );
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Unable to unsend.');
          }
        },
      },
    ]);
  };

  const handleBlock = async () => {
    if (!token || !otherUserId) return;
    try {
      await feedApi.blockUser(token, otherUserId);
      setBlock((prev) => ({ ...prev, is_blocked: true }));
      if (conversationId) removeConversationLocally(conversationId);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Unable to block.');
    }
  };

  const handleUnblock = async () => {
    if (!token || !otherUserId) return;
    try {
      await feedApi.unblockUser(token, otherUserId);
      setBlock((prev) => ({ ...prev, is_blocked: false }));
      loadRelationship();
      refreshConversations();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Unable to unblock.');
    }
  };

  const handleDelete = async () => {
    if (!conversationId) {
      router.back();
      return;
    }
    try {
      await deleteConversation(conversationId);
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Unable to delete chat.');
    }
  };

  const viewProfile = () => router.push({ pathname: '/profile/[id]', params: { id: username } });

  const lastMessage = messages[messages.length - 1];
  const showSeen = lastMessage && lastMessage.sender_id !== otherUserId && lastMessage.is_read && !lastMessage.is_deleted;
  const otherTyping = otherUserId ? isTyping(otherUserId) : false;

  let footer: React.ReactNode;
  if (block.is_blocked) {
    footer = <BlockedFooter username={`@${username}`} onUnblock={() => setUnblockVisible(true)} onDelete={() => setDeleteVisible(true)} />;
  } else if (block.is_blocked_by || !canMessage.can_message) {
    footer = (
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          {block.is_blocked_by ? 'You cannot message this user.' : chatApi.canMessageReasonText(canMessage.reason)}
        </Text>
      </View>
    );
  } else {
    footer = (
      <MessageInputBar
        onSend={handleSend}
        onTypingChange={(typing) => otherUserId && emitTyping(otherUserId, typing)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ConversationHeader
        username={username}
        avatarUrl={avatarUrl}
        online={otherUserId ? isOnline(otherUserId) : false}
        typing={otherTyping}
        onPressProfile={viewProfile}
        onPressMenu={() => setOptionsVisible(true)}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isLoading ? (
          <ActivityIndicator style={styles.loading} color={AppColors.link} />
        ) : messages.length === 0 ? (
          <NewConversationProfileCard username={username} avatarUrl={avatarUrl} onViewProfile={viewProfile} />
        ) : (
          <FlatList
            // Inverted list keeps the newest message pinned to the bottom.
            inverted
            data={[...messages].reverse()}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <>
                {otherTyping ? (
                  <View style={styles.typingBubble}>
                    <Text style={styles.typingText}>typing…</Text>
                  </View>
                ) : null}
                {showSeen ? <Text style={styles.seen}>Seen {formatSeen(lastMessage.read_at)}</Text> : null}
              </>
            }
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                fromMe={item.sender_id !== otherUserId}
                onLongPress={() => setMenuMessage(item)}
              />
            )}
          />
        )}

        {footer}
      </KeyboardAvoidingView>

      <ChatOptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        username={username}
        isBlocked={block.is_blocked}
        canDelete={Boolean(conversationId)}
        onViewProfile={viewProfile}
        onBlockToggle={() => (block.is_blocked ? setUnblockVisible(true) : setBlockVisible(true))}
        onDelete={() => setDeleteVisible(true)}
      />

      <BlockUserSheet
        visible={blockVisible}
        onClose={() => setBlockVisible(false)}
        name={`@${username}`}
        avatarUrl={avatarUrl}
        onConfirm={handleBlock}
      />

      <UnblockUserSheet
        visible={unblockVisible}
        onClose={() => setUnblockVisible(false)}
        username={`@${username}`}
        onConfirm={handleUnblock}
      />

      <DeleteConversationSheet visible={deleteVisible} onClose={() => setDeleteVisible(false)} onConfirm={handleDelete} />

      <MessageContextMenu
        visible={menuMessage !== null}
        onClose={() => setMenuMessage(null)}
        onCopy={
          menuMessage?.message
            ? () => {
                Clipboard.setStringAsync(menuMessage.message ?? '');
              }
            : null
        }
        onUnsend={menuMessage && menuMessage.sender_id !== otherUserId && !menuMessage.is_deleted ? () => handleUnsend(menuMessage) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  flex: {
    flex: 1,
  },
  loading: {
    paddingVertical: 48,
  },
  messages: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  seen: {
    alignSelf: 'flex-end',
    color: AppColors.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
  },
  typingText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  notice: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
  },
  noticeText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
