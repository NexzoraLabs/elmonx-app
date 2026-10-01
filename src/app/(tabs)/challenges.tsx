import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChallengeRow } from '@/components/rewards/challenge-row';
import { RewardIconRow } from '@/components/rewards/reward-icon-row';
import { RewardPillButton } from '@/components/rewards/reward-pill-button';
import { SocialProgressRow } from '@/components/rewards/social-progress-row';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { CHALLENGES, type ChallengeDefinition } from '@/data/challenges';
import { DROP_ACTION_KEYS, FOLLOWER_TIERS, FOLLOW_TIERS, SOCIAL_ACTION_KEYS } from '@/data/social-tasks';
import * as rewardsApi from '@/services/rewards-api';
import type { RewardStatus, RewardTasks, SocialActionProgress } from '@/services/rewards-api';

function statusOf(tasks: RewardTasks, key: string): RewardStatus {
  const value = tasks[key];
  return typeof value === 'string' ? (value as RewardStatus) : 'pending';
}

function activeTier(tasks: RewardTasks, tiers: typeof FOLLOW_TIERS) {
  const next = tiers.find((tier) => {
    const status = statusOf(tasks, tier.key);
    return status !== 'complete' && status !== 'done';
  });
  return next ?? tiers[tiers.length - 1];
}

export default function ChallengesScreen() {
  const { token } = useAuth();

  const [actionsTasks, setActionsTasks] = useState<RewardTasks>({});
  const [socialTasks, setSocialTasks] = useState<RewardTasks>({});
  const [isLoadingActions, setIsLoadingActions] = useState(true);
  const [isLoadingSocial, setIsLoadingSocial] = useState(true);
  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = useCallback((type: 'success' | 'error', message: string) => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner({ type, message });
    bannerTimer.current = setTimeout(() => setBanner(null), 3000);
  }, []);

  const loadActionsTasks = useCallback(async () => {
    if (!token) return;
    setIsLoadingActions(true);
    try {
      const data = await rewardsApi.getTasks(token, 'actions');
      setActionsTasks(data);
    } catch {
      // Keep the previous tasks visible on a transient failure.
    } finally {
      setIsLoadingActions(false);
    }
  }, [token]);

  const loadSocialTasks = useCallback(async () => {
    if (!token) return;
    setIsLoadingSocial(true);
    try {
      const data = await rewardsApi.getTasks(token, 'social');
      setSocialTasks(data);
    } catch {
      // Keep the previous tasks visible on a transient failure.
    } finally {
      setIsLoadingSocial(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadActionsTasks();
    loadSocialTasks();
  }, [loadActionsTasks, loadSocialTasks]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const nextResetAt = actionsTasks.next_reset_at ? new Date(actionsTasks.next_reset_at).getTime() : null;
  const resetCountdownLabel = (() => {
    if (!nextResetAt) return '';
    const diffMs = nextResetAt - now;
    if (diffMs <= 0) return '00:00:00';
    const totalSeconds = Math.floor(diffMs / 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  })();

  const claim = async (type: string, action: 'actions' | 'social', onSuccess: () => void) => {
    if (!token) return;
    setClaimingKey(type);
    try {
      const result = await rewardsApi.claimTask(token, type, action);
      showBanner('success', result.message || 'Claimed!');
      onSuccess();
    } catch (e) {
      showBanner('error', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setClaimingKey(null);
    }
  };

  const handleClaimAction = async (definition: ChallengeDefinition) => {
    if (statusOf(actionsTasks, definition.key) !== 'available') return;
    if (definition.isSpin) {
      if (!token) return;
      setClaimingKey(definition.key);
      try {
        const result = await rewardsApi.spinReward(token);
        showBanner('success', `${result.reward_label}! is heading your way!`);
        loadActionsTasks();
      } catch (e) {
        showBanner('error', e instanceof Error ? e.message : 'Error spinning wheel');
      } finally {
        setClaimingKey(null);
      }
      return;
    }
    claim(definition.key, 'actions', loadActionsTasks);
  };

  const handleClaimSocialRow = (row: SocialActionProgress) => {
    if (row.claimable_points <= 0) return;
    claim(row.action, 'social', loadSocialTasks);
  };

  const handleClaimSocialMeta = (key: string) => {
    if (statusOf(socialTasks, key) !== 'available') return;
    claim(key, 'social', loadSocialTasks);
  };

  const handleClaimFollowTier = (key: string) => {
    if (statusOf(actionsTasks, key) !== 'available') return;
    claim(key, 'actions', loadActionsTasks);
  };

  const socialProgress = (socialTasks.progress ?? []).filter((row) =>
    SOCIAL_ACTION_KEYS.includes(row.action)
  );
  const dropProgress = (socialTasks.progress ?? []).filter((row) => DROP_ACTION_KEYS.includes(row.action));

  const weeklyDays = actionsTasks.week_complete_days ?? 0;
  const monthlyDays = actionsTasks.monthly_complete_days ?? 0;
  const dailyGoal = socialTasks.daily_goal ?? 0;
  const goalActionsToday = socialTasks.goal_actions_today ?? 0;
  const goalClaimedToday = socialTasks.goal_claimed_today === true;
  const goalStatus = statusOf(socialTasks, 'social_daily_goal');

  const followTier = activeTier(actionsTasks, FOLLOW_TIERS);
  const followerTier = activeTier(actionsTasks, FOLLOWER_TIERS);
  const followCount = actionsTasks.follow_count ?? 0;
  const followerCount = actionsTasks.follower_count ?? 0;

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
        <Text style={styles.headerTitle}>Daily Quests, Earn XP</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {banner ? (
          <View style={[styles.banner, banner.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
            <Text style={styles.bannerText}>{banner.message}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>ACTIONS</Text>
        <Text style={styles.sectionSubtitle}>Complete these actions inside ELMONX to earn XP points.</Text>
        <View style={styles.card}>
          {CHALLENGES.map((definition, index) => (
            <View key={definition.key}>
              <ChallengeRow
                index={index + 1}
                definition={definition}
                tasks={actionsTasks}
                isLoading={isLoadingActions}
                isClaiming={claimingKey === definition.key}
                resetCountdownLabel={resetCountdownLabel}
                onPress={handleClaimAction}
              />
              {index < CHALLENGES.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>SOCIAL</Text>
        <Text style={styles.sectionSubtitle}>Complete these tasks on ELMONX Social to earn XP points.</Text>
        <View style={styles.card}>
          {isLoadingSocial ? <ActivityIndicator style={styles.loadingIndicator} color={AppColors.link} /> : null}

          {!isLoadingSocial && socialProgress.length > 0 ? (
            <View style={styles.goodToKnow}>
              <Text style={styles.goodToKnowTitle}>Good to know</Text>
              <Text style={styles.goodToKnowText}>
                Earn points on posts and drops only once. Re-liking or commenting on content you&apos;ve already
                earned from won&apos;t earn additional points.
              </Text>
            </View>
          ) : null}

          {!isLoadingSocial &&
            socialProgress.map((row) => (
              <View key={row.action}>
                <SocialProgressRow
                  row={row}
                  variant="social"
                  resetCountdownLabel={resetCountdownLabel}
                  isClaiming={claimingKey === row.action}
                  onPress={handleClaimSocialRow}
                />
                <View style={styles.divider} />
              </View>
            ))}

          {!isLoadingSocial ? (
            <>
          <RewardIconRow
            icon="locate-outline"
            title="Daily Social Goal"
            description="Do all three above — post, comment, like — then tap claim. That's one day done."
            pointsLabel="+15 XP">
            {goalStatus === 'available' ? (
              <RewardPillButton
                tone="claimable"
                label="Claim"
                loading={claimingKey === 'social_daily_goal'}
                onPress={() => handleClaimSocialMeta('social_daily_goal')}
              />
            ) : goalClaimedToday ? (
              <View style={styles.buttonCol}>
                <RewardPillButton tone="done" label="Claimed" />
                <Text style={styles.countdown}>Next in {resetCountdownLabel}</Text>
              </View>
            ) : (
              <RewardPillButton tone="pending" label={`${goalActionsToday}/${dailyGoal} done`} />
            )}
          </RewardIconRow>
          <View style={styles.divider} />

          <RewardIconRow
            icon="calendar-outline"
            title="Social Streak (7 Days)"
            description="Claim 7 days in a row to earn bonus points. Skip a day and the count goes back to zero."
            pointsLabel="+100 XP">
            {statusOf(socialTasks, 'social_weekly_streak') === 'available' ? (
              <RewardPillButton
                tone="claimable"
                label="Claim"
                loading={claimingKey === 'social_weekly_streak'}
                onPress={() => handleClaimSocialMeta('social_weekly_streak')}
              />
            ) : (
              <RewardPillButton tone="pending" label={`${weeklyDays}/7 days`} />
            )}
          </RewardIconRow>
          <View style={styles.divider} />

          <RewardIconRow
            icon="medal-outline"
            title="Social Loyalty (30 Days)"
            description="Claim 30 days in a row to earn your reward. Skip a day and the count goes back to zero."
            pointsLabel="+500 XP">
            {statusOf(socialTasks, 'social_monthly_streak') === 'available' ? (
              <RewardPillButton
                tone="claimable"
                label="Claim"
                loading={claimingKey === 'social_monthly_streak'}
                onPress={() => handleClaimSocialMeta('social_monthly_streak')}
              />
            ) : (
              <RewardPillButton tone="pending" label={`${monthlyDays}/30 days`} />
            )}
          </RewardIconRow>

          {dropProgress.map((row) => (
            <View key={row.action}>
              <View style={styles.divider} />
              <SocialProgressRow
                row={row}
                variant="drop"
                resetCountdownLabel={resetCountdownLabel}
                isClaiming={claimingKey === row.action}
                onPress={handleClaimSocialRow}
              />
            </View>
          ))}
            </>
          ) : null}

          <View style={styles.divider} />
          <RewardIconRow icon="person-add-outline" title={followTier.title} description={followTier.description} pointsLabel={`+${followTier.points} XP`}>
            {statusOf(actionsTasks, followTier.key) === 'available' ? (
              <RewardPillButton
                tone="claimable"
                label="Claim"
                loading={claimingKey === followTier.key}
                onPress={() => handleClaimFollowTier(followTier.key)}
              />
            ) : statusOf(actionsTasks, followTier.key) === 'complete' || statusOf(actionsTasks, followTier.key) === 'done' ? (
              <RewardPillButton tone="done" label="Done" />
            ) : (
              <RewardPillButton tone="pending" label={`${followCount} of ${followTier.goal}`} />
            )}
          </RewardIconRow>
          <View style={styles.divider} />

          <RewardIconRow icon="people-outline" title={followerTier.title} description={followerTier.description} pointsLabel={`+${followerTier.points} XP`}>
            {statusOf(actionsTasks, followerTier.key) === 'available' ? (
              <RewardPillButton
                tone="claimable"
                label="Claim"
                loading={claimingKey === followerTier.key}
                onPress={() => handleClaimFollowTier(followerTier.key)}
              />
            ) : statusOf(actionsTasks, followerTier.key) === 'complete' || statusOf(actionsTasks, followerTier.key) === 'done' ? (
              <RewardPillButton tone="done" label="Done" />
            ) : (
              <RewardPillButton tone="pending" label={`${followerCount} of ${followerTier.goal}`} />
            )}
          </RewardIconRow>
        </View>
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
  banner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  bannerError: {
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  bannerText: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionLabelSpaced: {
    marginTop: 24,
  },
  sectionSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 12,
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
  loadingIndicator: {
    paddingVertical: 24,
  },
  goodToKnow: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.success,
    backgroundColor: 'rgba(52,199,89,0.06)',
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
    marginBottom: 4,
  },
  goodToKnowTitle: {
    color: AppColors.success,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  goodToKnowText: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
  countdown: {
    color: AppColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  buttonCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
