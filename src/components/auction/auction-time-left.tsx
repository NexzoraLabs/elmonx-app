import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useNow } from '@/hooks/use-now';
import { formatCountdown, type AuctionCard } from '@/services/auction-api';

type Props = {
  auction: Pick<AuctionCard, 'status' | 'start_time' | 'end_time'>;
  style?: StyleProp<TextStyle>;
  /** 'icon' = "⏱ 2h 10m" (home cards), 'label' = "Ends in 2h 10m" (auction list). */
  variant?: 'icon' | 'label';
};

/** Ticking countdown text for auction cards. Only this Text re-renders each second. */
export function AuctionTimeLeft({ auction, style, variant = 'icon' }: Props) {
  const { t } = useTranslation();
  const now = useNow();
  const isLive = auction.status === 'Live';
  if (!isLive && auction.status !== 'Upcoming') return null;
  const time = formatCountdown(new Date(isLive ? auction.end_time : auction.start_time).getTime() - now);
  const text =
    variant === 'label'
      ? isLive
        ? t('Ends in {{time}}', { time })
        : t('Starts in {{time}}', { time })
      : `${isLive ? '⏱' : '🗓'} ${time}`;
  return <Text style={style}>{text}</Text>;
}
