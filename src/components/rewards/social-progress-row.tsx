import { Text, View } from 'react-native';

import { RewardIconRow } from '@/components/rewards/reward-icon-row';
import { RewardPillButton } from '@/components/rewards/reward-pill-button';
import { makeStyles } from '@/context/theme-context';
import { SOCIAL_ACTION_HINTS, SOCIAL_ACTION_ICONS } from '@/data/social-tasks';
import type { SocialActionProgress } from '@/services/rewards-api';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

type Props = {
  row: SocialActionProgress;
  variant: 'social' | 'drop';
  resetCountdownLabel: string;
  isClaiming: boolean;
  onPress: (row: SocialActionProgress) => void;
};

function claimLabel(row: SocialActionProgress, t: TFunction): string {
  if (row.no_drops_available) return t('Caught Up');
  if (row.claimable_points > 0) return t('Claim {{points}}', { points: row.claimable_points });
  if (row.is_capped) return t('Claimed');
  return t('Pending');
}

function claimTone(row: SocialActionProgress): 'claimable' | 'disabled' | 'pending' {
  if (row.no_drops_available) return 'disabled';
  if (row.claimable_points > 0) return 'claimable';
  if (row.is_capped) return 'disabled';
  return 'pending';
}

export function SocialProgressRow({ row, variant, resetCountdownLabel, isClaiming, onPress }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();
  const icon = SOCIAL_ACTION_ICONS[row.action] ?? 'star-outline';
  const hint = SOCIAL_ACTION_HINTS[row.action] ? t(SOCIAL_ACTION_HINTS[row.action]) : undefined;
  const percent = row.daily_limit ? Math.min(100, (row.completed_today / row.daily_limit) * 100) : 0;

  const extra = row.no_drops_available ? (
    <Text style={styles.caughtUp}>{t('You\'re all caught up. New drops earn again.')}</Text>
  ) : (
    <>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {t('{{done}} of {{limit}} today', { done: row.completed_today, limit: row.daily_limit })}
        </Text>
      </View>
      {row.is_capped ? (
        <Text style={styles.capNote}>
          {variant === 'drop'
            ? t('Daily limit reached — come back tomorrow')
            : t('Daily limit reached — resets in {{time}}', { time: resetCountdownLabel })}
        </Text>
      ) : null}
    </>
  );

  return (
    <RewardIconRow icon={icon} title={row.label} description={hint} pointsLabel={t('+{{points}} XP', { points: row.points_per_action })} extra={extra}>
      <RewardPillButton
        tone={claimTone(row)}
        label={claimLabel(row, t)}
        disabled={row.claimable_points <= 0}
        loading={isClaiming}
        onPress={() => onPress(row)}
      />
    </RewardIconRow>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
