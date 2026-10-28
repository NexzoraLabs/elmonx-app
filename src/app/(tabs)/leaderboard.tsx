import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, useAppColors } from '@/context/theme-context';
import * as rewardsApi from '@/services/rewards-api';
import type { LeaderboardUser } from '@/services/rewards-api';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { appendUnique } from '@/services/http';
import { resolveAvatar } from '@/services/profile-api';

const ITEMS_PER_PAGE = 10;
const RANK_COLORS = ['#F5B400', '#B5B8C0', '#C97B3D'] as const;

function levelLabel(user: LeaderboardUser): string {
  if (!user.level) return '';
  return user.tier_name
    ? i18n.t('Level {{level}} · {{tier}}', { level: user.level, tier: user.tier_name })
    : i18n.t('Level {{level}}', { level: user.level });
}

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
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
      setRankings((prev) => appendUnique(append ? prev : [], data.rankings || [], (p) => p.user_id || p._id));
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('Leaderboard')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* FlatList, not ScrollView + map: rankings grow with every "Load more". */}
      <FlatList
        data={isLoading ? [] : rankings}
        keyExtractor={(player) => player.user_id || player._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>{t('Activity Rankings')}</Text>
            <Text style={styles.subtitle}>{t('Top performers in the all time period')}</Text>
          </>
        }
        ListEmptyComponent={isLoading ? <ActivityIndicator style={styles.loadingIndicator} color={AppColors.link} /> : null}
        renderItem={({ item: player, index }) => {
          const isLast = index === rankings.length - 1 && currentPage >= totalPages;
          return (
            <View style={[styles.cardRow, index === 0 && styles.cardRowFirst, isLast && styles.cardRowLast]}>
              <RankRow rank={index + 1} user={player} />
              {!isLast ? <View style={styles.divider} /> : null}
            </View>
          );
        }}
        ListFooterComponent={
          !isLoading && rankings.length > 0 && currentPage < totalPages ? (
            <View style={[styles.cardRow, styles.cardRowLast]}>
              <Pressable
                onPress={handleLoadMore}
                disabled={isLoadingMore}
                style={({ pressed }) => [styles.loadMoreButton, pressed && styles.pressed]}>
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={AppColors.link} />
                ) : (
                  <Text style={styles.loadMoreText}>{t('Load more')}</Text>
                )}
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function RankRow({ rank, user }: { rank: number; user: LeaderboardUser }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const isTop3 = rank <= 3;
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.rankSlot}>
          {isTop3 ? (
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
          <Image source={resolveAvatar(user.avatar)} style={styles.avatar} contentFit="cover" />
          <View>
            <Text style={styles.userName} numberOfLines={1}>
              {user.user_name || t('Unknown')}
            </Text>
            {levelLabel(user) ? <Text style={styles.levelText}>{levelLabel(user)}</Text> : null}
          </View>
        </Pressable>
      </View>
      <Text style={styles.points}>{t('{{n}} XP', { n: user.points || 0 })}</Text>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
  // One ranking row; the first/last rows round the card's corners.
  cardRow: {
    backgroundColor: AppColors.surface,
    paddingHorizontal: 14,
  },
  cardRowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardRowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
}));
