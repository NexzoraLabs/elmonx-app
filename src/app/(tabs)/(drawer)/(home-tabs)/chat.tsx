import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatFilterTabs, type ChatFilter } from '@/components/chat/chat-filter-tabs';
import { ChatSearchBar } from '@/components/chat/chat-search-bar';
import { ConversationRow } from '@/components/chat/conversation-row';
import { MessagesHeader } from '@/components/chat/messages-header';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { searchUsers, type SuggestedUser } from '@/services/feed-api';
import { resolveAvatar } from '@/services/profile-api';

export default function ChatListScreen() {
  const { token } = useAuth();
  const { conversations, isLoadingConversations, refreshConversations, isOnline, isTyping, currentUserId } = useChat();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ChatFilter>('All');
  const [people, setPeople] = useState<SuggestedUser[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh unread counts / last messages whenever the tab is opened.
  useFocusEffect(
    useCallback(() => {
      refreshConversations();
    }, [refreshConversations])
  );

  // Website: "Search people to message…" (300ms debounce, leading @ stripped).
  const trimmed = query.trim().replace(/^@/, '');
  useEffect(() => {
    if (!trimmed) return;
    let active = true;
    const timer = setTimeout(() => {
      searchUsers(token, trimmed)
        .then((users) => active && setPeople(users.filter((u) => u._id !== currentUserId)))
        .catch(() => active && setPeople([]));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [token, trimmed, currentUserId]);

  const unreadCount = conversations.filter((c) => c.unread_count > 0).length;
  const filtered = conversations
    .filter((c) => !trimmed || c.participant.user_name.toLowerCase().includes(trimmed.toLowerCase()))
    .filter((c) => (filter === 'Unread' ? c.unread_count > 0 : true));
  const conversationUserIds = new Set(conversations.map((c) => c.participant._id));
  const newPeople = trimmed ? people.filter((p) => !conversationUserIds.has(p._id)) : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshConversations();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <MessagesHeader onPressCompose={() => router.push('/chat/new')} />
      <ChatSearchBar value={query} onChangeText={setQuery} />
      <ChatFilterTabs selected={filter} onSelect={setFilter} unreadCount={unreadCount} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={AppColors.textSecondary} />}>
        {isLoadingConversations && conversations.length === 0 ? (
          <ActivityIndicator style={styles.loading} color={AppColors.link} />
        ) : filtered.length === 0 && newPeople.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {trimmed ? 'No people found.' : filter === 'Unread' ? 'No unread conversations.' : 'No conversations yet.'}
            </Text>
          </View>
        ) : (
          filtered.map((conversation) => (
            <ConversationRow
              key={conversation.conversation_id}
              conversation={conversation}
              online={isOnline(conversation.participant._id)}
              typing={isTyping(conversation.participant._id)}
            />
          ))
        )}

        {newPeople.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>People</Text>
            {newPeople.map((user) => (
              <Pressable
                key={user._id}
                style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: '/chat/[id]',
                    params: { id: 'new', userId: user._id, username: user.user_name, avatar: user.profile_avatar ?? '' },
                  })
                }>
                <Image source={{ uri: resolveAvatar(user.profile_avatar) }} style={styles.personAvatar} contentFit="cover" />
                <View style={styles.personText}>
                  <View style={styles.personNameRow}>
                    <Text style={styles.personName}>@{user.user_name}</Text>
                    {user.profile_privacy === 'Private' ? (
                      <Ionicons name="lock-closed" size={12} color={AppColors.textSecondary} />
                    ) : null}
                  </View>
                  <Text style={styles.personMeta}>{user.followers_count ?? 0} followers</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  loading: {
    paddingVertical: 48,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
  },
  personText: {
    flex: 1,
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  personName: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  personMeta: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
