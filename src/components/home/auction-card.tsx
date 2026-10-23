import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { makeStyles, useAppColors } from '@/context/theme-context';
import { AuctionTimeLeft } from '@/components/auction/auction-time-left';
import { MOTION } from '@/constants/motion';
import { type AuctionCard as AuctionCardData, auctionImage } from '@/services/auction-api';
import { useTranslation } from 'react-i18next';
import { PressableScale } from '@/components/motion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Show 2 full cards + gap in the scroll view (20px padding each side, 12px gap between)
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

/** Blinking "live" dot, animated on the UI thread (it used to re-render the card every 700 ms). */
export function LiveDot() {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    opacity.set(withRepeat(withTiming(0.2, { duration: MOTION.duration.slow * 2 }), -1, true));
    return () => cancelAnimation(opacity);
  }, [reduceMotion, opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.View style={[styles.dot, styles.dotVisible, animatedStyle]} />;
}

export function AuctionCardHome({ auction }: { auction: AuctionCardData }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const img = auctionImage(auction.drop);
  const isLive = auction.status === 'Live';
  const isUpcoming = auction.status === 'Upcoming';

  const priceLabel = auction.status === 'Ended'
    ? (auction.clearing_price != null ? t('Sold at') : t('Ended'))
    : auction.total_bids > 0 ? t('Current bid') : t('Starting bid');
  const price = auction.status === 'Ended' ? auction.clearing_price : auction.current_price;

  return (
    <PressableScale
      pressScale="card"
      style={styles.card}
      onPress={() => router.push({ pathname: '/auction/[id]', params: { id: auction._id } })}>
      <View style={styles.imageWrap}>
        {img ? (
          <Image cachePolicy="memory-disk" source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: AppColors.surface }]} />
        )}
        {isLive && (
          <View style={styles.badge}>
            <LiveDot />
            <Text style={styles.badgeText}>{t('Live')}</Text>
          </View>
        )}
        {isUpcoming && (
          <View style={[styles.badge, styles.badgeUpcoming]}>
            <Text style={styles.badgeText}>{t('Upcoming')}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{auction.drop?.title ?? '—'}</Text>
        <AuctionTimeLeft auction={auction} style={styles.countdown} />
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{priceLabel}</Text>
          {price != null ? (
            <Text style={styles.price}>{t('{{amount}} X', { amount: price.toLocaleString() })}</Text>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const useStyles = makeStyles((AppColors) => ({
  card: {
    width: CARD_WIDTH,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageWrap: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * (870 / 660),
    backgroundColor: AppColors.border,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,67,56,0.85)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeUpcoming: {
    backgroundColor: 'rgba(61,139,255,0.85)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  dotVisible: { opacity: 1 },
  dotHidden: { opacity: 0 },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  info: {
    padding: 10,
    gap: 4,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  countdown: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceLabel: {
    color: AppColors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  price: {
    color: AppColors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
}));
