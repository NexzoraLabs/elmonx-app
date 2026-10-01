import { StyleSheet, Text, View } from 'react-native';

import { RewardPillButton, toneForStatus } from '@/components/rewards/reward-pill-button';
import { AppColors } from '@/constants/app-colors';
import type { ChallengeDefinition } from '@/data/challenges';
import type { RewardStatus, RewardTasks } from '@/services/rewards-api';

type Props = {
  index: number;
  definition: ChallengeDefinition;
  tasks: RewardTasks | null;
  isLoading: boolean;
  isClaiming: boolean;
  resetCountdownLabel: string;
  onPress: (definition: ChallengeDefinition) => void;
};

function statusOf(tasks: RewardTasks | null, key: string): RewardStatus {
  const value = tasks?.[key];
  return typeof value === 'string' ? (value as RewardStatus) : 'pending';
}

export function ChallengeRow({ index, definition, tasks, isLoading, isClaiming, resetCountdownLabel, onPress }: Props) {
  const status = statusOf(tasks, definition.key);
  const isDone = status === 'complete' || status === 'done';
  const isAvailable = status === 'available';

  const progressValue = definition.progress ? (tasks?.[definition.progress.key] as number | undefined) ?? 0 : 0;
  const showProgressBadge = definition.progress && !isAvailable && !isDone;
  const showRepeatingCountdown = definition.isRepeating && isDone && resetCountdownLabel;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index}</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{definition.title}</Text>
          <Text style={styles.description}>{definition.description}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.points}>{definition.pointsLabel}</Text>

        {definition.isInfoOnly ? null : isLoading ? (
          <View style={styles.loadingBox} />
        ) : showProgressBadge ? (
          <RewardPillButton tone="pending" label={`${progressValue}/${definition.progress?.goal} days`} />
        ) : (
          <View style={styles.buttonCol}>
            <RewardPillButton
              tone={toneForStatus(status)}
              label={isDone ? 'Done' : isAvailable ? (definition.isSpin ? 'Spin' : 'Claim') : 'Pending'}
              disabled={!isAvailable}
              loading={isClaiming}
              onPress={() => onPress(definition)}
            />
            {showRepeatingCountdown ? <Text style={styles.countdown}>Next in {resetCountdownLabel}</Text> : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  indexBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(61,139,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: AppColors.link,
    fontWeight: '700',
    fontSize: 16,
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: AppColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  points: {
    color: AppColors.success,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingBox: {
    width: 70,
    height: 30,
  },
  buttonCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  countdown: {
    color: AppColors.textSecondary,
    fontSize: 10,
  },
});
