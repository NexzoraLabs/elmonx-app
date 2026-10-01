import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { compactCount } from '@/components/feed/post-card';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as feedApi from '@/services/feed-api';
import type { SuggestedUser } from '@/services/feed-api';
import { resolveAvatar } from '@/services/profile-api';

export default function UserSearchScreen() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = query.trim();

  // Debounced search as the user types.
  useEffect(() => {
    if (!trimmed) return;
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const users = await feedApi.searchUsers(token, trimmed);
        if (active) setResults(users);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Search failed.');
      } finally {
        if (active) setIsSearching(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [token, trimmed]);

  const visible = trimmed ? results : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={AppColors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search users"
            placeholderTextColor={AppColors.textPlaceholder}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={100}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={AppColors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !trimmed ? (
            <Text style={styles.hint}>Find collectors by their username.</Text>
          ) : isSearching ? (
            <ActivityIndicator style={styles.loading} color={AppColors.link} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.hint}>No users found for &quot;{trimmed}&quot;.</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.user_name } })}>
            <Image source={{ uri: resolveAvatar(item.profile_avatar) }} style={styles.avatar} contentFit="cover" />
            <View style={styles.rowText}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.user_name}
                </Text>
                {item.profile_privacy === 'Private' ? (
                  <Ionicons name="lock-closed" size={12} color={AppColors.textSecondary} />
                ) : null}
              </View>
              <Text style={styles.followers}>{compactCount(item.followers_count)} followers</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
          </Pressable>
        )}
      />
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
    gap: 12,
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
  pressed: {
    opacity: 0.7,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.surface,
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  loading: {
    paddingVertical: 40,
  },
  hint: {
    color: AppColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
  },
  rowText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  followers: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
