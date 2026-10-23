import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { makeStyles } from '@/context/theme-context';
import { formatCountdown } from '@/services/auction-api';

type Props = {
  label: string;
  /** Epoch ms the countdown runs to. */
  target: number;
  /** server time − device time, so every phone counts down to the same moment. */
  serverDiff: number;
  extensionMinutes: number;
};

/** "Ends in / Starts in" box. Ticks by itself, so the auction page doesn't re-render every second. */
export function AuctionCountdown({ label, target, serverDiff, extensionMinutes }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.countdownBox}>
      <Text style={styles.countdownLabel}>{label}</Text>
      <Text style={styles.countdownValue}>{formatCountdown(target - (now + serverDiff))}</Text>
      {extensionMinutes > 0 && <Text style={styles.extensionNote}>{t('Extended +{{mins}}m', { mins: extensionMinutes })}</Text>}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  countdownBox: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 2,
  },
  countdownLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownValue: {
    color: AppColors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  extensionNote: {
    color: AppColors.gold,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
}));
