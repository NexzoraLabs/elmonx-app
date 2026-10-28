import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatFilterTabs, type ChatFilter } from '@/components/chat/chat-filter-tabs';
import { ChatSearchBar } from '@/components/chat/chat-search-bar';
import { ConversationRow } from '@/components/chat/conversation-row';
import { MessagesHeader } from '@/components/chat/messages-header';
import { HomeHeader } from '@/components/home/home-header';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { useChat, useChatPresence } from '@/context/chat-context';
import { searchUsers, type SuggestedUser } from '@/services/feed-api';
import { resolveAvatar } from '@/services/profile-api';
import { useTranslation } from 'react-i18next';
import { followersLabel } from '@/i18n';

export default function ChatListScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const { conversations, isLoadingConversations, refreshConversations, currentUserId } = useChat();
  const { isOnline, isTyping } = useChatPresence();
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
      <HomeHeader />
      <MessagesHeader onPressCompose={() => router.push('/chat/new')} />
      <ChatSearchBar value={query} onChangeText={setQuery} />
      <ChatFilterTabs selected={filter} onSelect={setFilter} unreadCount={unreadCount} />

      {/* FlatList: only the visible conversations are mounted. */}
      <FlatList
        data={isLoadingConversations && conversations.length === 0 ? [] : filtered}
        keyExtractor={(conversation) => conversation.conversation_id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={AppColors.textSecondary} />}
        renderItem={({ item: conversation }) => (
          <ConversationRow
            conversation={conversation}
            online={isOnline(conversation.participant._id)}
            typing={isTyping(conversation.participant._id)}
          />
        )}
        ListEmptyComponent={
          isLoadingConversations && conversations.length === 0 ? (
            <ActivityIndicator style={styles.loading} color={AppColors.link} />
          ) : newPeople.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {trimmed ? t('No people found.') : filter === 'Unread' ? t('No unread conversations.') : t('No conversations yet.')}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          newPeople.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>{t('People')}</Text>
              {newPeople.map((user) => (
                <Pressable
                  key={user._id}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}
                  onPress={() =>
                    router.push({
                      pathname: '/chat/[id]',
                      params: { id: 'new', userId: user._id, username: user.user_name, avatar: user.profile_avatar ?? '' },
                    })
                  }>
                  <Image source={resolveAvatar(user.profile_avatar)} style={styles.personAvatar} contentFit="cover" />
                  <View style={styles.personText}>
                    <View style={styles.personNameRow}>
                      <Text style={styles.personName}>@{user.user_name}</Text>
                      {user.profile_privacy === 'Private' ? (
                        <Ionicons name="lock-closed" size={12} color={AppColors.textSecondary} />
                      ) : null}
                    </View>
                    <Text style={styles.personMeta}>{followersLabel(user.followers_count ?? 0)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
