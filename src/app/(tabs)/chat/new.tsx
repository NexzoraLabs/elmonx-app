import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SuggestedUserRow } from '@/components/chat/suggested-user-row';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { getSuggestedUsers, searchUsers, type SuggestedUser } from '@/services/feed-api';

export default function NewMessageScreen() {
  const { token } = useAuth();
  const { conversations, currentUserId } = useChat();
  const [query, setQuery] = useState('');
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [results, setResults] = useState<SuggestedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const trimmed = query.trim().replace(/^@/, '');

  useEffect(() => {
    let active = true;
    getSuggestedUsers(token, 15)
      .then((users) => active && setSuggested(users))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!trimmed) return;
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsers(token, trimmed);
        if (active) setResults(users);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [token, trimmed]);

  const openChat = (user: SuggestedUser) => {
    // Reuse the existing conversation when there is one (website deep-link logic).
    const existing = conversations.find((c) => c.participant._id === user._id);
    router.replace({
      pathname: '/chat/[id]',
      params: {
        id: existing?.conversation_id ?? 'new',
        userId: user._id,
        username: user.user_name,
        avatar: user.profile_avatar ?? '',
      },
    });
  };

  const list = (trimmed ? results : suggested).filter((u) => u._id !== currentUserId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>New Message</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.toRow}>
        <Text style={styles.toLabel}>To:</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people to message…"
          placeholderTextColor={AppColors.textPlaceholder}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
          style={styles.toInput}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>{trimmed ? 'Results' : 'Suggested'}</Text>
        {trimmed && isSearching && results.length === 0 ? (
          <ActivityIndicator style={styles.loading} color={AppColors.link} />
        ) : list.length === 0 ? (
          <Text style={styles.empty}>{trimmed ? 'No people found.' : 'No suggestions right now.'}</Text>
        ) : (
          list.map((user) => <SuggestedUserRow key={user._id} user={user} onPress={() => openChat(user)} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  toRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  toLabel: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  toInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  loading: {
    paddingVertical: 24,
  },
  empty: {
    color: AppColors.textSecondary,
    fontSize: 13,
    paddingVertical: 24,
    textAlign: 'center',
  },
});
