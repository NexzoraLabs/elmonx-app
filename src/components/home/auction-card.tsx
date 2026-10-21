import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import { type AuctionCard as AuctionCardData, auctionImage, formatCountdown } from '@/services/auction-api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Show 2 full cards + gap in the scroll view (20px padding each side, 12px gap between)
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

function LiveDot() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 700);
    return () => clearInterval(id);
  }, []);
  return <View style={[styles.dot, visible ? styles.dotVisible : styles.dotHidden]} />;
}

export function AuctionCardHome({ auction, now }: { auction: AuctionCardData; now: number }) {
  const img = auctionImage(auction.drop);
  const isLive = auction.status === 'Live';
  const isUpcoming = auction.status === 'Upcoming';

  let timeLeft = '';
  if (isLive) timeLeft = formatCountdown(new Date(auction.end_time).getTime() - now);
  else if (isUpcoming) timeLeft = formatCountdown(new Date(auction.start_time).getTime() - now);

  const priceLabel = auction.status === 'Ended'
    ? (auction.clearing_price != null ? 'Sold at' : 'Ended')
    : auction.total_bids > 0 ? 'Current bid' : 'Starting bid';
  const price = auction.status === 'Ended' ? auction.clearing_price : auction.current_price;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/auction/[id]', params: { id: auction._id } })}>
      <View style={styles.imageWrap}>
        {img ? (
          <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: AppColors.surface }]} />
        )}
        {isLive && (
          <View style={styles.badge}>
            <LiveDot />
            <Text style={styles.badgeText}>Live</Text>
          </View>
        )}
        {isUpcoming && (
          <View style={[styles.badge, styles.badgeUpcoming]}>
            <Text style={styles.badgeText}>Upcoming</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{auction.drop?.title ?? '—'}</Text>
        {timeLeft ? (
          <Text style={styles.countdown}>{isLive ? '⏱ ' : '🗓 '}{timeLeft}</Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{priceLabel}</Text>
          {price != null ? (
            <Text style={styles.price}>{price.toLocaleString()} X</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
});
