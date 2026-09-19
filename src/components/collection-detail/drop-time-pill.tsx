import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import { useCountdown } from '@/hooks/use-countdown';

export function DropTimePill({ targetMs }: { targetMs: number }) {
  const { days, hours, minutes, seconds } = useCountdown(targetMs);

  return (
    <View style={styles.row}>
      <Ionicons name="time-outline" size={16} color={AppColors.textSecondary} />
      <Text style={styles.label}>Drop Time</Text>
      <View style={styles.spacer} />
      <Text style={styles.value}>
        {days}
        <Text style={styles.unit}>d</Text> {String(hours).padStart(2, '0')}
        <Text style={styles.unit}>h</Text> {String(minutes).padStart(2, '0')}
        <Text style={styles.unit}>m</Text> {String(seconds).padStart(2, '0')}
        <Text style={styles.unit}>s</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  spacer: {
    flex: 1,
  },
  value: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
  },
});
