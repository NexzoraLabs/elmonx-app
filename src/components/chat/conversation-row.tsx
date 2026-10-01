import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import type { ConversationItem } from '@/services/chat-api';
import { resolveAvatar } from '@/services/profile-api';

export function formatChatTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

type Props = {
  conversation: ConversationItem;
  online: boolean;
  typing: boolean;
};

export function ConversationRow({ conversation, online, typing }: Props) {
  const participant = conversation.participant;
  const unread = conversation.unread_count > 0;
  const preview = conversation.last_message
    ? `${conversation.last_message_is_mine ? 'You: ' : ''}${conversation.last_message}`
    : 'No messages yet';

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() =>
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: conversation.conversation_id,
            userId: participant._id,
            username: participant.user_name,
            avatar: participant.profile_avatar || participant.profile_avatar_url || '',
          },
        })
      }>
      <View>
        <Image
          source={{ uri: resolveAvatar(participant.profile_avatar || participant.profile_avatar_url) }}
          style={styles.avatar}
          contentFit="cover"
        />
        {online ? <View style={styles.onlineDot} /> : null}
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, unread && styles.nameUnread]} numberOfLines={1}>
          @{participant.user_name}
        </Text>
        <Text style={[styles.preview, typing && styles.typing, unread && styles.previewUnread]} numberOfLines={1}>
          {typing ? 'typing…' : preview}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.timestamp}>{formatChatTime(conversation.last_message_at)}</Text>
        {unread ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{conversation.unread_count}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.surface,
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.success,
    borderWidth: 2,
    borderColor: AppColors.background,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  nameUnread: {
    fontWeight: '800',
  },
  preview: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  previewUnread: {
    color: AppColors.textPrimary,
  },
  typing: {
    color: AppColors.success,
    fontStyle: 'italic',
  },
  meta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timestamp: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: AppColors.link,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
