import { Text, View } from 'react-native';

import { makeStyles } from '@/context/theme-context';
import { useCountdown } from '@/hooks/use-countdown';
import { useTranslation } from 'react-i18next';

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function CountdownDigits({ targetMs }: { targetMs: number }) {
  const styles = useStyles();
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
  const { t } = useTranslation();
  const styles = useStyles();
  const { days, hours, minutes, seconds } = useCountdown(targetMs);
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>
        {days}{t('D')}{' '}{pad(hours)}{t('H')}{' '}{pad(minutes)}{t('M')}{' '}{pad(seconds)}{t('S')}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
    color: AppColors.onMedia,
    fontSize: 10,
    fontWeight: '700',
  },
}));
