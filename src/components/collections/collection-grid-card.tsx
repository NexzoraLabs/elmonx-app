import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { CollectionGridItem } from '@/data/collections-mock';

type CollectionGridCardProps = {
  item: CollectionGridItem;
  layout?: 'single' | 'grid';
};

function EditionBadge({ edition }: { edition: string }) {
  const isDigitalProof = edition === 'Digital Proof';
  const isArtistProof = edition === 'Artist Proof';
  const isStudyEdition = edition === 'Study Edition';

  if (!isDigitalProof && !isArtistProof && !isStudyEdition) return null;

  const bg = isDigitalProof
    ? '#0245c3'
    : isArtistProof
      ? '#FF6D00'
      : '#EC407A';

  return (
    <View style={[styles.editionBadge, { backgroundColor: bg }]}>
      <Ionicons name="star" size={8} color="#fff" />
      <Text style={styles.editionBadgeText}>{edition.toUpperCase()}</Text>
    </View>
  );
}

function PriceBadge({ item }: { item: CollectionGridItem }) {
  if (!item.priceKind || item.priceKind === 'gbp' && !item.price) return null;

  if (item.priceKind === 'xcoin') {
    return (
      <View style={styles.priceBadge}>
        <Ionicons name="logo-bitcoin" size={11} color={AppColors.gold} />
        <Text style={styles.priceBadgeText}>{item.price?.toLocaleString()}</Text>
      </View>
    );
  }
  if (item.priceKind === 'airdrop') {
    return (
      <View style={styles.priceBadge}>
        <Ionicons name="gift-outline" size={11} color="#fff" />
        <Text style={styles.priceBadgeText}>Airdrop</Text>
      </View>
    );
  }
  if (item.priceKind === 'gbp' && item.price) {
    return (
      <View style={styles.priceBadge}>
        <Text style={styles.priceBadgeText}>£{item.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>
    );
  }
  return null;
}

export function CollectionGridCard({ item, layout = 'grid' }: CollectionGridCardProps) {
  const isSingle = layout === 'single';

  const total = item.totalEditions ?? 0;
  const consumed = item.consumedEditions ?? 0;
  const remaining = Math.max(0, total - consumed);
  const mintedPct = total > 0 ? Math.min(100, (consumed / total) * 100) : 0;
  const isLowStock = !item.isSoldOut && total > 0 && remaining <= 5;

  const progressColor = item.isSoldOut
    ? '#EF4444'
    : isLowStock
      ? '#F97316'
      : '#8B5CF6';

  return (
    <Pressable
      style={[styles.card, isSingle ? styles.cardSingle : styles.cardGrid]}
      onPress={() =>
        router.push({
          pathname: item.category === 'Collections' ? '/collection/[id]' : '/drop/[id]',
          params: { id: item.id },
        })
      }>

      {/* ── Image area ── */}
      <View style={[styles.imageOuter, isSingle ? styles.imageOuterSingle : styles.imageOuterGrid]}>
        {item.imageUrl ? (
          <>
            {/* Ambient glow */}
            <Image
              source={{ uri: item.imageUrl }}
              style={[StyleSheet.absoluteFill, styles.ambientGlow]}
              contentFit="cover"
              blurRadius={22}
            />
            {/* Main image */}
            {isSingle ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.thumbInner}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                  transition={150}
                />
              </View>
            )}
          </>
        ) : (
          <PlaceholderThumb color={item.color} icon="image-outline" style={StyleSheet.absoluteFill} />
        )}

      </View>

      {/* ── Card body ── */}
      <View style={styles.body}>

        {/* Edition badge + price badge row */}
        {(item.dropEdition || item.isBlindBox || item.priceKind) ? (
          <View style={styles.badgeRow}>
            {item.dropEdition ? <EditionBadge edition={item.dropEdition} /> : null}
            {item.isBlindBox ? (
              <View style={[styles.editionBadge, { backgroundColor: AppColors.gold }]}>
                <Text style={[styles.editionBadgeText, { color: AppColors.background }]}>BLIND BOX</Text>
              </View>
            ) : null}
            <View style={styles.badgeSpacer} />
            <PriceBadge item={item} />
          </View>
        ) : null}

        {/* Title + arrow */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title.toUpperCase()}
          </Text>
          <View style={styles.arrowCircle}>
            <Ionicons
              name="arrow-forward-outline"
              size={11}
              color={AppColors.textPrimary}
              style={styles.arrowIcon}
            />
          </View>
        </View>

        {/* Edition count row */}
        {total > 0 ? (
          <View style={styles.editionRow}>
            <View style={styles.editionLeft}>
              <Ionicons name="layers-outline" size={11} color={AppColors.textSecondary} />
              {total === 1 ? (
                <Text style={styles.editionText}>1 of 1 · Unique</Text>
              ) : (
                <Text style={styles.editionText}>
                  Edition of <Text style={styles.editionCount}>{total.toLocaleString()}</Text>
                </Text>
              )}
            </View>
            {item.isSoldOut ? (
              <Text style={styles.soldOut}>Sold out</Text>
            ) : isLowStock ? (
              <Text style={styles.lowStock}>Only {remaining} left!</Text>
            ) : (
              <Text style={styles.remaining}>
                <Text style={styles.remainingCount}>{remaining.toLocaleString()}</Text> left
              </Text>
            )}
          </View>
        ) : null}

        {/* Progress bar */}
        {total > 0 ? (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${mintedPct}%` as `${number}%`, backgroundColor: progressColor },
              ]}
            />
          </View>
        ) : null}

        {/* Date bar */}
        {item.dropDate ? (
          <View style={styles.dateBar}>
            <Ionicons name="calendar-outline" size={11} color={AppColors.textSecondary} />
            <Text style={styles.dateText}>{item.dropDate}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  cardGrid: {
    width: '48%',
  },
  cardSingle: {
    width: '100%',
  },

  /* Image area */
  imageOuter: {
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111212',
  },
  imageOuterGrid: {
    aspectRatio: 1,
  },
  imageOuterSingle: {
    aspectRatio: 1.55,
  },
  ambientGlow: {
    opacity: 0.4,
    transform: [{ scale: 1.25 }],
  },
  /* Fixed-pixel inset wrapper — guarantees true center for grid images */
  thumbInner: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
  },

  editionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  editionBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  priceBadgeText: {
    color: AppColors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },

  /* Body */
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badgeSpacer: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 7,
  },

  /* Title */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  arrowIcon: {
    transform: [{ rotate: '-45deg' }],
  },

  /* Edition row */
  editionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  editionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  editionText: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
  editionCount: {
    color: AppColors.textPrimary,
    fontWeight: '600',
  },
  soldOut: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 0,
  },
  lowStock: {
    color: '#F97316',
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 0,
  },
  remaining: {
    color: AppColors.textSecondary,
    fontSize: 11,
    flexShrink: 0,
  },
  remainingCount: {
    color: AppColors.textPrimary,
    fontWeight: '600',
  },

  /* Progress bar */
  progressTrack: {
    height: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Date bar */
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  dateText: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
