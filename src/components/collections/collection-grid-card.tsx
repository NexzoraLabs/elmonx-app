import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CardImageBadges } from '@/components/collections/card-image-badges';
import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { makeStyles, useAppColors } from '@/context/theme-context';
import type { CollectionGridItem } from '@/data/collections-mock';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';

import { enterAt, PressableScale } from '@/components/motion';

type CollectionGridCardProps = {
  item: CollectionGridItem;
  layout?: 'single' | 'grid';
  /** Position in its list — plays the standard staggered entrance. */
  index?: number;
};

// Collection banners: start at 3:2 until the image reports its size; keep extreme shapes sane.
const DEFAULT_BANNER_RATIO = 3 / 2;
const MIN_BANNER_RATIO = 0.8;
const MAX_BANNER_RATIO = 3;

export function CollectionGridCard({ item, layout = 'grid', index }: CollectionGridCardProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const isSingle = layout === 'single';
  const [bannerRatio, setBannerRatio] = useState(DEFAULT_BANNER_RATIO);

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

  // The wrapper owns the grid width + entrance (a transform); the pressable inside owns the press
  // scale (also a transform) — on one view the two animations would overwrite each other.
  return (
    <Animated.View
      entering={index === undefined ? undefined : enterAt(index)}
      style={isSingle ? styles.cardSingle : styles.cardGrid}>
    <PressableScale
      pressScale="card"
      style={styles.card}
      onPress={() => {
        if (item.parentDropId) {
          // Individual blind box item — open its detail page
          router.push({ pathname: '/blindbox-item/[dropId]/[itemId]', params: { dropId: item.parentDropId, itemId: item.id } });
        } else {
          router.push({
            pathname: item.category === 'Collections' ? '/collection/[id]' : '/drop/[id]',
            params: { id: item.id },
          });
        }
      }}>

      {/* ── Image area ── a very faint well (`imageWell`) running edge to edge across the top of
           the card (VeVe-style; the card's own radius rounds its top corners, the bottom stays
           square), with the whole artwork centred and inset inside it. */}
      <View>
        <View style={[styles.imageOuter, isSingle ? styles.imageOuterSingle : styles.imageOuterGrid]}>
          {isSingle ? (
            // Collection banner: the frame takes the image's own shape, so the whole banner shows
            // (no crop) with the same 12pt gap on all four sides.
            <View style={[styles.bannerFrame, { aspectRatio: bannerRatio }]}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                  transition={150}
                  onLoad={(event) => {
                    const { width, height } = event.source;
                    if (width > 0 && height > 0) {
                      setBannerRatio(Math.min(MAX_BANNER_RATIO, Math.max(MIN_BANNER_RATIO, width / height)));
                    }
                  }}
                />
              ) : (
                <PlaceholderThumb color={item.color} icon="image-outline" style={StyleSheet.absoluteFill} />
              )}
            </View>
          ) : item.imageUrl ? (
            // Drop artwork is shown whole (contain) — it carries its own transparent margin.
            <Image source={{ uri: item.imageUrl }} style={styles.artInset} contentFit="contain" transition={150} />
          ) : (
            <PlaceholderThumb color={item.color} icon="image-outline" style={StyleSheet.absoluteFill} />
          )}
          <CardImageBadges item={item} />
        </View>
      </View>

      {/* ── Card body ── */}
      <View style={styles.body}>

        {/* Title + arrow */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title.toUpperCase()}
          </Text>
        </View>

        {/* Edition count row */}
        {total > 0 ? (
          <View style={styles.editionRow}>
            <View style={styles.editionLeft}>
              <Ionicons name="layers-outline" size={11} color={AppColors.textSecondary} />
              {total === 1 ? (
                <Text style={styles.editionText}>{t('1 of 1 · Unique')}</Text>
              ) : (
                <Text style={styles.editionText}>
                  {t('Edition of')}{' '}<Text style={styles.editionCount}>{total.toLocaleString()}</Text>
                </Text>
              )}
            </View>
            {item.isSoldOut ? (
              <Text style={styles.soldOut}>{t('Sold out')}</Text>
            ) : isLowStock ? (
              <Text style={styles.lowStock}>{t('Only {{n}} left!', { n: remaining })}</Text>
            ) : (
              <Text style={styles.remaining}>
                <Text style={styles.remainingCount}>{remaining.toLocaleString()}</Text>{' '}{t('left')}
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

        {/* Description — single layout only */}
        {isSingle && item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Date bar */}
        {item.dropDate ? (
          <View style={styles.dateBar}>
            <Ionicons name="calendar-outline" size={11} color={AppColors.textSecondary} />
            <Text style={styles.dateText}>{item.dropDate}</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
    </Animated.View>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
  /** Artwork sits inset in the edge-to-edge well, so it never touches the card edges. */
  artInset: {
    position: 'absolute',
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
  },
  bannerFrame: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageOuter: {
    // Explicit full width: with a margin + aspectRatio, Yoga sized this box from its height
    // instead, leaving it narrower than the card and stuck to the left.
    width: '100%',
    overflow: 'hidden',
    backgroundColor: AppColors.imageWell,
  },
  imageOuterGrid: {
    aspectRatio: 660 / 870,
  },
  imageOuterSingle: {
    padding: 12,
  },


  /* Body */
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 7,
  },
  description: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -3,
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
    backgroundColor: AppColors.subtleFill,
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
    borderTopColor: AppColors.subtleFill,
  },
  dateText: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
}));
