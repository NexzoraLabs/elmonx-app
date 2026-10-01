import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LevelRankCard } from '@/components/rewards/level-rank-card';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as rewardsApi from '@/services/rewards-api';
import type { PointsTransaction, ProfileLevel, ProfileTier } from '@/services/rewards-api';

const ITEMS_PER_PAGE = 10;

function formatTitle(type: string): string {
  if (!type) return 'Transaction';
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function RewardsScreen() {
  const { token } = useAuth();

  const [totalEarned, setTotalEarned] = useState(0);
  const [totalEarnedCount, setTotalEarnedCount] = useState(0);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  const [totalRedeemedCount, setTotalRedeemedCount] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [level, setLevel] = useState<ProfileLevel | null>(null);
  const [tier, setTier] = useState<ProfileTier | null>(null);
  const [isLoadingLevel, setIsLoadingLevel] = useState(true);

  const loadPoints = useCallback(
    async (page: number, append: boolean) => {
      if (!token) return;
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      try {
        const data = await rewardsApi.getUserPoints(token, { current_page: page, items_per_page: ITEMS_PER_PAGE });
        setTotalEarned(data.total_earned);
        setTotalEarnedCount(data.total_earned_count);
        setTotalRedeemed(data.total_redeemed);
        setTotalRedeemedCount(data.total_redeemed_count);
        setNetBalance(data.net_balance);
        setTransactions((prev) => (append ? [...prev, ...(data.transactions || [])] : data.transactions || []));
        setTotalPages(data.pagination?.total_pages || 1);
        setCurrentPage(page);
      } catch {
        // Keep whatever was already loaded on a transient failure.
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token]
  );

  const loadLevelStats = useCallback(async () => {
    if (!token) return;
    setIsLoadingLevel(true);
    try {
      const settings = await rewardsApi.getAccountSettings(token);
      if (!settings?.user_name) {
        setIsLoadingLevel(false);
        return;
      }
      const stats = await rewardsApi.getProfileStats(token, settings.user_name);
      setLevel(stats.level);
      setTier(stats.tier);
    } catch {
      setLevel(null);
      setTier(null);
    } finally {
      setIsLoadingLevel(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadPoints(1, false);
    loadLevelStats();
  }, [loadPoints, loadLevelStats]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) loadPoints(currentPage + 1, true);
  };

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
        <Text style={styles.headerTitle}>App Rewards</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quests, earn XP"
          hitSlop={8}
          onPress={() => router.push('/challenges')}
          style={({ pressed }) => [styles.questsButton, pressed && styles.pressed]}>
          <Ionicons name="trophy-outline" size={16} color={AppColors.buttonPrimaryText} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>View all your app rewards transactions and activity</Text>

        <View style={styles.levelCardWrap}>
          <LevelRankCard loading={isLoadingLevel} level={level} tier={tier} />
        </View>

        <View style={styles.statsRow}>
          <StatBlock
            title="Total Earned"
            value={totalEarned}
            subtext={`From ${totalEarnedCount} activities`}
            icon="trending-up"
            tone="up"
            loading={isLoading}
          />
          <StatBlock
            title="Total Redeemed"
            value={totalRedeemed}
            subtext={`${totalRedeemedCount} redemptions`}
            icon="trending-down"
            tone="down"
            loading={isLoading}
          />
          <StatBlock
            title="Net Balance"
            value={netBalance}
            subtext="Current available balance"
            icon="calendar-outline"
            tone="neutral"
            loading={isLoading}
          />
        </View>

        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.card}>
          {isLoading ? (
            <ActivityIndicator style={styles.loadingIndicator} color={AppColors.link} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={28} color={AppColors.textSecondary} />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          ) : (
            <>
              {transactions.map((tx, index) => {
                const isEarned = tx.tx_type === 'credit';
                return (
                  <View key={`${tx.createdAt}-${index}`}>
                    <View style={styles.txRow}>
                      <View style={styles.txLeft}>
                        <View style={styles.txIcon}>
                          <Ionicons name="diamond-outline" size={16} color={AppColors.textSecondary} />
                        </View>
                        <View>
                          <Text style={styles.txTitle}>{formatTitle(tx.type)}</Text>
                          <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleString()}</Text>
                        </View>
                      </View>
                      <View style={styles.txRight}>
                        <View style={[styles.txBadge, isEarned ? styles.txBadgeEarned : styles.txBadgeRedeemed]}>
                          <Text style={[styles.txBadgeText, isEarned ? styles.txBadgeTextEarned : styles.txBadgeTextRedeemed]}>
                            {isEarned ? 'earned' : 'redeemed'}
                          </Text>
                        </View>
                        <Text style={[styles.txAmount, isEarned ? styles.txAmountEarned : styles.txAmountRedeemed]}>
                          {isEarned ? '+' : '-'}
                          {tx.amount} XP
                        </Text>
                      </View>
                    </View>
                    {index < transactions.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                );
              })}

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
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type StatTone = 'up' | 'down' | 'neutral';

function StatBlock({
  title,
  value,
  subtext,
  icon,
  tone,
  loading,
}: {
  title: string;
  value: number;
  subtext: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: StatTone;
  loading: boolean;
}) {
  const toneColor = tone === 'up' ? AppColors.success : tone === 'down' ? AppColors.danger : AppColors.link;
  return (
    <View style={statStyles.card}>
      <View style={statStyles.topRow}>
        <Text style={statStyles.label}>{title}</Text>
        <View style={[statStyles.iconBadge, { backgroundColor: `${toneColor}1A` }]}>
          <Ionicons name={icon} size={14} color={toneColor} />
        </View>
      </View>
      {loading ? (
        <View style={statStyles.loadingValue} />
      ) : (
        <Text style={statStyles.value}>{value} XP</Text>
      )}
      <Text style={statStyles.subtext}>{subtext}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  loadingValue: {
    height: 18,
    width: 50,
    borderRadius: 4,
    backgroundColor: AppColors.border,
  },
  subtext: {
    color: AppColors.textSecondary,
    fontSize: 10,
  },
});

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
  questsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.buttonPrimaryBg,
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
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },
  levelCardWrap: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  sectionTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  loadingIndicator: {
    paddingVertical: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.border,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  txDate: {
    color: AppColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  txBadgeEarned: {
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderColor: 'rgba(52,199,89,0.2)',
  },
  txBadgeRedeemed: {
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderColor: 'rgba(255,69,58,0.2)',
  },
  txBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txBadgeTextEarned: {
    color: AppColors.success,
  },
  txBadgeTextRedeemed: {
    color: AppColors.danger,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  txAmountEarned: {
    color: AppColors.success,
  },
  txAmountRedeemed: {
    color: AppColors.danger,
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
