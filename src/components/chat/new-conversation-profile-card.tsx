import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { Conversation } from '@/data/chat-mock';

export function NewConversationProfileCard({ conversation }: { conversation: Conversation }) {
  return (
    <View style={styles.container}>
      <PlaceholderThumb color={conversation.avatarColor} icon="person-outline" style={styles.avatar} iconSize={30} />
      <Text style={styles.name}>{conversation.name}</Text>
      <Text style={styles.username}>{conversation.username}</Text>

      {conversation.followersCount != null ? (
        <Text style={styles.meta}>
          {conversation.followersCount} followers
          {conversation.mutualFollow ? '\nYou follow each other on ElmonX' : ''}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.actionButton}>
          <Ionicons name="person-outline" size={16} color={AppColors.textPrimary} />
          <Text style={styles.actionLabel}>View Profile</Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Ionicons name="add-circle-outline" size={16} color={AppColors.textPrimary} />
          <Text style={styles.actionLabel}>Follow</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  username: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  meta: {
    color: AppColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});
