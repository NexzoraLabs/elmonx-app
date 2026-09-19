import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import { useCountdown } from '@/hooks/use-countdown';

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function CountdownDigits({ targetMs }: { targetMs: number }) {
  const { days, hours, minutes, seconds } = useCountdown(targetMs);
  return (
    <View style={styles.row}>
      {[days, hours, minutes, seconds].map((value, index) => (
        <View key={index} style={styles.segment}>
          <Text style={styles.digits}>{pad(value)}</Text>
        </View>
      ))}
    </View>
  );
}

export function CountdownPill({ targetMs }: { targetMs: number }) {
  const { days, hours, minutes, seconds } = useCountdown(targetMs);
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>
        {days}D {pad(hours)}H {pad(minutes)}M {pad(seconds)}S
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  segment: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  digits: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  pillText: {
    color: AppColors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
});
