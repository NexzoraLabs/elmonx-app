import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type Tone = 'claimable' | 'done' | 'pending' | 'disabled';

type Props = {
  label: string;
  tone: Tone;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function RewardPillButton({ label, tone, onPress, disabled, loading, style }: Props) {
  const isPressable = !disabled && !loading && tone === 'claimable';

  return (
    <Pressable
      disabled={!isPressable}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, styles[tone], pressed && isPressable && styles.pressed, style]}>
      {loading ? (
        <ActivityIndicator size="small" color={AppColors.textPrimary} />
      ) : (
        <Text style={[styles.text, toneTextStyle[tone]]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 83,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  claimable: {
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderColor: 'rgba(52,199,89,0.25)',
  },
  done: {
    backgroundColor: 'rgba(154,154,161,0.1)',
    borderColor: 'rgba(154,154,161,0.2)',
  },
  pending: {
    backgroundColor: 'rgba(245,180,0,0.1)',
    borderColor: 'rgba(245,180,0,0.2)',
  },
  disabled: {
    backgroundColor: 'rgba(154,154,161,0.08)',
    borderColor: 'rgba(154,154,161,0.15)',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

const toneTextStyle: Record<Tone, { color: string }> = {
  claimable: { color: AppColors.success },
  done: { color: AppColors.textSecondary },
  pending: { color: AppColors.gold },
  disabled: { color: AppColors.textSecondary },
};

export function toneForStatus(status: 'available' | 'pending' | 'complete' | 'done'): Tone {
  if (status === 'available') return 'claimable';
  if (status === 'complete' || status === 'done') return 'done';
  return 'pending';
}
