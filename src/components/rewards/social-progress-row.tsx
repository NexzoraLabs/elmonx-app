import { StyleSheet, Text, View } from 'react-native';

import { RewardIconRow } from '@/components/rewards/reward-icon-row';
import { RewardPillButton } from '@/components/rewards/reward-pill-button';
import { AppColors } from '@/constants/app-colors';
import { SOCIAL_ACTION_HINTS, SOCIAL_ACTION_ICONS } from '@/data/social-tasks';
import type { SocialActionProgress } from '@/services/rewards-api';

type Props = {
  row: SocialActionProgress;
  variant: 'social' | 'drop';
  resetCountdownLabel: string;
  isClaiming: boolean;
  onPress: (row: SocialActionProgress) => void;
};

function claimLabel(row: SocialActionProgress): string {
  if (row.no_drops_available) return 'Caught Up';
  if (row.claimable_points > 0) return `Claim ${row.claimable_points}`;
  if (row.is_capped) return 'Claimed';
  return 'Pending';
}

function claimTone(row: SocialActionProgress): 'claimable' | 'disabled' | 'pending' {
  if (row.no_drops_available) return 'disabled';
  if (row.claimable_points > 0) return 'claimable';
  if (row.is_capped) return 'disabled';
  return 'pending';
}

export function SocialProgressRow({ row, variant, resetCountdownLabel, isClaiming, onPress }: Props) {
  const icon = SOCIAL_ACTION_ICONS[row.action] ?? 'star-outline';
  const hint = SOCIAL_ACTION_HINTS[row.action];
  const percent = row.daily_limit ? Math.min(100, (row.completed_today / row.daily_limit) * 100) : 0;

  const extra = row.no_drops_available ? (
    <Text style={styles.caughtUp}>You&apos;re all caught up. New drops earn again.</Text>
  ) : (
    <>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {row.completed_today} of {row.daily_limit} today
        </Text>
      </View>
      {row.is_capped ? (
        <Text style={styles.capNote}>
          {variant === 'drop'
            ? 'Daily limit reached — come back tomorrow'
            : `Daily limit reached — resets in ${resetCountdownLabel}`}
        </Text>
      ) : null}
    </>
  );

  return (
    <RewardIconRow icon={icon} title={row.label} description={hint} pointsLabel={`+${row.points_per_action} XP`} extra={extra}>
      <RewardPillButton
        tone={claimTone(row)}
        label={claimLabel(row)}
        disabled={row.claimable_points <= 0}
        loading={isClaiming}
        onPress={() => onPress(row)}
      />
    </RewardIconRow>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  progressTrack: {
    width: 70,
    height: 5,
    borderRadius: 999,
    backgroundColor: AppColors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: AppColors.link,
  },
  progressLabel: {
    color: AppColors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  capNote: {
    color: AppColors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  caughtUp: {
    color: AppColors.textPlaceholder,
    fontSize: 11,
    marginTop: 6,
  },
});
