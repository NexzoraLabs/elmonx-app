import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { Conversation } from '@/data/chat-mock';

export function ConversationRow({ conversation }: { conversation: Conversation }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(`/chat/${conversation.id}`)}>
      <PlaceholderThumb
        color={conversation.avatarColor}
        icon="person-outline"
        style={styles.avatar}
        iconSize={20}
      />

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {conversation.name}
        </Text>

        {conversation.isBlocked ? (
          <Text style={styles.blockedText}>You blocked this user</Text>
        ) : (
          <View style={styles.previewRow}>
            {conversation.lastMessageRead ? (
              <Ionicons name="checkmark-done" size={14} color={AppColors.rarityRare} />
            ) : null}
            {conversation.lastMessageIsImage ? (
              <Ionicons name="image-outline" size={14} color={AppColors.textSecondary} />
            ) : null}
            <Text style={styles.preview} numberOfLines={1}>
              {conversation.lastMessagePreview}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <Text style={styles.timestamp}>{conversation.timestamp}</Text>
        {conversation.unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
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
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  preview: {
    flex: 1,
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  blockedText: {
    color: AppColors.danger,
    fontSize: 13,
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
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: AppColors.buttonPrimaryText,
    fontSize: 10,
    fontWeight: '700',
  },
});
