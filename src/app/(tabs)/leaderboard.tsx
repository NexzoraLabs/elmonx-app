import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import * as rewardsApi from '@/services/rewards-api';
import type { LeaderboardUser } from '@/services/rewards-api';

const ITEMS_PER_PAGE = 10;
const RANK_COLORS = ['#F5B400', '#B5B8C0', '#C97B3D'];

function levelLabel(user: LeaderboardUser): string {
  if (!user.level) return '';
  return user.tier_name ? `Level ${user.level} · ${user.tier_name}` : `Level ${user.level}`;
}

export default function LeaderboardScreen() {
  const [rankings, setRankings] = useState<LeaderboardUser[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const load = useCallback(async (page: number, append: boolean) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    try {
      const data = await rewardsApi.getLeaderboard({ current_page: page, items_per_page: ITEMS_PER_PAGE });
      setRankings((prev) => (append ? [...prev, ...(data.rankings || [])] : data.rankings || []));
      setTotalPages(data.pagination?.total_pages || 1);
      setCurrentPage(page);
    } catch {
      // Keep whatever was already loaded on a transient failure.
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load(1, false);
  }, [load]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) load(currentPage + 1, true);
  };

  const podium = currentPage === 1 ? rankings.slice(0, 3) : [];

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
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Activity Rankings</Text>
        <Text style={styles.subtitle}>Top performers in the all time period</Text>

        {isLoading ? (
          <ActivityIndicator style={styles.loadingIndicator} color={AppColors.link} />
        ) : (
          <>
            {podium.length === 3 ? <Podium users={podium} /> : null}

            <View style={styles.card}>
              {rankings.map((player, index) => (
                <View key={player._id || player.user_id}>
                  <RankRow rank={index + 1} user={player} />
                  {index < rankings.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}

              {currentPage < totalPages ? (
                <Pressable
                  onPress={handleLoadMore}
                  disabled={isLoadingMore}
                  style={({ pressed }) => [styles.loadMoreButton, pressed && styles.pressed]}>
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color={AppColors.link} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RankRow({ rank, user }: { rank: number; user: LeaderboardUser }) {
  const highlight = rank <= 3;
  return (
    <View
      style={[
        styles.row,
        highlight && { backgroundColor: `${RANK_COLORS[rank - 1]}1A`, borderColor: `${RANK_COLORS[rank - 1]}40` },
      ]}>
      <View style={styles.rowLeft}>
        <View style={styles.rankSlot}>
          {highlight ? (
            <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[rank - 1] }]}>
              <Text style={styles.rankBadgeText}>{rank}</Text>
            </View>
          ) : (
            <Text style={styles.rankText}>#{rank}</Text>
          )}
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: user.user_name } })}
          style={styles.userTouch}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <PlaceholderThumb color={AppColors.border} icon="person-outline" style={styles.avatar} iconSize={18} />
          )}
          <View>
            <Text style={styles.userName} numberOfLines={1}>
              {user.user_name || 'Unknown'}
            </Text>
            {levelLabel(user) ? <Text style={styles.levelText}>{levelLabel(user)}</Text> : null}
          </View>
        </Pressable>
      </View>
      <Text style={styles.points}>{user.points || 0} XP</Text>
    </View>
  );
}

function Podium({ users }: { users: LeaderboardUser[] }) {
  const [first, second, third] = users;
  return (
    <View style={styles.podiumRow}>
      <PodiumSlot user={second} rank={2} height={72} />
      <PodiumSlot user={first} rank={1} height={96} />
      <PodiumSlot user={third} rank={3} height={60} />
    </View>
  );
}

function PodiumSlot({ user, rank, height }: { user: LeaderboardUser; rank: number; height: number }) {
  return (
    <View style={styles.podiumSlot}>
      <View style={[styles.podiumAvatarRing, { borderColor: RANK_COLORS[rank - 1] }]}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.podiumAvatar} contentFit="cover" />
        ) : (
          <PlaceholderThumb color={AppColors.border} icon="person-outline" style={styles.podiumAvatar} iconSize={22} />
        )}
        <View style={[styles.podiumRankBadge, { backgroundColor: RANK_COLORS[rank - 1] }]}>
          <Text style={styles.podiumRankText}>{rank}</Text>
        </View>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {user.user_name || 'Unknown'}
      </Text>
      <Text style={styles.podiumPoints}>{user.points || 0} XP</Text>
      <View style={[styles.podiumBar, { height, backgroundColor: `${RANK_COLORS[rank - 1]}26` }]} />
    </View>
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
  pressed: {
    opacity: 0.7,
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  loadingIndicator: {
    paddingVertical: 40,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
  },
  podiumAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  podiumRankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.background,
  },
  podiumRankText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  podiumName: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 90,
  },
  podiumPoints: {
    color: AppColors.success,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  podiumBar: {
    width: '100%',
    borderRadius: 8,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  rankSlot: {
    width: 28,
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  rankText: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  userTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.border,
  },
  userName: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  levelText: {
    color: AppColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  points: {
    color: AppColors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  loadMoreText: {
    color: AppColors.link,
    fontSize: 12,
    fontWeight: '700',
  },
});
