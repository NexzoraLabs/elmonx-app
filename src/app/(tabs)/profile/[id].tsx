import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommunityPostCard } from '@/components/home/community-post-card';
import { CollectorSuggestionCard } from '@/components/profile/collector-suggestion-card';
import { ProfileCover } from '@/components/profile/profile-cover';
import { ProfileStatsRow } from '@/components/profile/profile-stats-row';
import { ProfileTabs, type ProfileTab } from '@/components/profile/profile-tabs';
import { AppColors } from '@/constants/app-colors';
import { COMMUNITY_POSTS } from '@/data/home-mock';
import { PROFILES } from '@/data/profile-mock';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = PROFILES[id];
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('posts');

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.notFound}>Profile not found.</Text>
      </SafeAreaView>
    );
  }

  const posts = COMMUNITY_POSTS.map((post) => ({
    ...post,
    name: profile.name,
    color: profile.avatarColor,
    verified: false,
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => router.back()}
        style={styles.backButton}>
        <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileCover avatarColor={profile.avatarColor} />

        <View style={styles.infoSection}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.memberSince}>Member since {profile.memberSince}</Text>

          <View style={styles.statsSpacing}>
            <ProfileStatsRow
              postCount={profile.postCount}
              followersCount={profile.followersCount}
              followingCount={profile.followingCount}
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.messageButton}>
              <Text style={styles.messageLabel}>Message</Text>
            </Pressable>
            <Pressable
              style={[styles.followButton, isFollowing && styles.followButtonActive]}
              onPress={() => setIsFollowing((prev) => !prev)}>
              <Text style={[styles.followLabel, isFollowing && styles.followLabelActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsTitle}>Collectors to Follow</Text>
            <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}>
            {profile.suggestions.map((suggestion) => (
              <CollectorSuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </ScrollView>
        </View>

        <ProfileTabs selected={tab} onSelect={setTab} />

        {tab === 'posts' ? (
          posts.map((post) => <CommunityPostCard key={post.id} post={post} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reposts yet.</Text>
          </View>
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
  notFound: {
    color: AppColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 20,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    paddingHorizontal: 20,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  memberSince: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statsSpacing: {
    marginTop: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  messageButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageLabel: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.buttonPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonActive: {
    backgroundColor: AppColors.border,
  },
  followLabel: {
    color: AppColors.buttonPrimaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  followLabelActive: {
    color: AppColors.textPrimary,
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  suggestionsTitle: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  suggestionsList: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
});
