import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { openGridItem } from '@/components/collections/open-grid-item';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { CardImageBadges } from '@/components/collections/card-image-badges';
import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { makeStyles, useAppColors } from '@/context/theme-context';
import type { CollectionGridItem } from '@/data/collections';
import { PressableScale } from '@/components/motion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

function PriceLabel({ item }: { item: CollectionGridItem }) {
  const AppColors = useAppColors();
  const styles = useStyles();
  if (!item.priceKind) return null;
  if (item.priceKind === 'xcoin') {
    return (
      <View style={styles.priceBadge}>
        <Ionicons name="logo-bitcoin" size={11} color={AppColors.gold} />
        <Text style={styles.priceBadgeText}>{item.price?.toLocaleString()}</Text>
      </View>
    );
  }
  if (item.priceKind === 'gbp' && item.price) {
    return (
      <View style={styles.priceBadge}>
        <Text style={styles.priceBadgeText}>
          £{item.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    );
  }
  return null;
}

export function CollectibleCard({ item }: { item: CollectionGridItem }) {
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <PressableScale
      pressScale="card"
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => openGridItem(item)}>
      <View style={styles.imageOuter}>
        {item.imageUrl ? (
          <Image cachePolicy="memory-disk"
            source={{ uri: item.imageUrl }}
            style={styles.artInset}
            contentFit="contain"
            transition={150}
          />
        ) : (
          <PlaceholderThumb color={item.color} icon="diamond-outline" iconSize={28} style={StyleSheet.absoluteFill} />
        )}
        {/* Same badges as the Collections grid (edition, blind box rarity, Airdrop). */}
        <CardImageBadges item={item} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title.toUpperCase()}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <PriceLabel item={item} />
          {item.dropDate ? (
            <View style={styles.dateRight}>
              <Ionicons name="calendar-outline" size={11} color={AppColors.textSecondary} />
              <Text style={styles.dateText}>{item.dropDate}</Text>
            </View>
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
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  // Edge-to-edge well across the top of the card (the card's radius rounds its top corners).
  imageOuter: {
    aspectRatio: 660 / 870,
    overflow: 'hidden',
    backgroundColor: AppColors.imageWell,
  },
  /** Artwork sits inset in the edge-to-edge well, so it never touches the card edges. */
  artInset: {
    position: 'absolute',
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  title: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.subtleFill,
    gap: 4,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceBadgeText: {
    color: AppColors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  dateRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  dateText: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
}));
