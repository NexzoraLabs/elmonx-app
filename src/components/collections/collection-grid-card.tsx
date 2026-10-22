import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { makeStyles, useAppColors } from '@/context/theme-context';
import type { CollectionGridItem } from '@/data/collections-mock';
import { useTranslation } from 'react-i18next';

type CollectionGridCardProps = {
  item: CollectionGridItem;
  layout?: 'single' | 'grid';
};

// Same edition checks as the website's nft-card.
function EditionBadge({ edition }: { edition: string }) {
  const styles = useStyles();
  const lower = edition.toLowerCase();
  const isDigitalProof = edition === 'Digital Proof';
  const isArtistProof = lower === 'artist proof' || lower === 'artist_proof';
  const isStudyEdition = edition === 'Study';

  if (!isDigitalProof && !isArtistProof && !isStudyEdition) return null;

  const bg = isDigitalProof ? '#0245c3' : isArtistProof ? '#FF6D00' : '#EC407A';
  const label = isDigitalProof ? 'DIGITAL PROOF' : isArtistProof ? 'ARTIST PROOF' : 'STUDY';

  return (
    <View style={[styles.editionBadge, { backgroundColor: bg }]}>
      <Ionicons name="star" size={8} color="#fff" />
      <Text style={styles.editionBadgeText}>{label}</Text>
    </View>
  );
}

export function CollectionGridCard({ item, layout = 'grid' }: CollectionGridCardProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
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

      {/* ── Image area ── whole artwork, centred, nothing painted behind it (drop images
           carry their own transparent margin around the frame). */}
      <View style={isSingle ? undefined : styles.imagePad}>
        <View style={[styles.imageOuter, isSingle ? styles.imageOuterSingle : styles.imageOuterGrid]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              transition={150}
            />
          ) : (
            <PlaceholderThumb color={item.color} icon="image-outline" style={StyleSheet.absoluteFill} />
          )}
        </View>
      </View>

      {/* ── Card body ── */}
      <View style={styles.body}>

        {/* Edition badge row */}
        {item.dropEdition ? (
          <View style={styles.badgeRow}>
            <EditionBadge edition={item.dropEdition} />
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
            <View style={[styles.statusDot, item.isUpcoming ? styles.dotUpcoming : styles.dotPast]} />
            <Text style={[styles.statusLabel, item.isUpcoming ? styles.statusLabelUpcoming : styles.statusLabelPast]}>
              {item.isUpcoming ? t('Dropping') : t('Dropped')}
            </Text>
            <View style={styles.dateSpacer} />
            <Ionicons name="calendar-outline" size={11} color={AppColors.textSecondary} />
            <Text style={styles.dateText}>{item.dropDate}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
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
  imagePad: {
    padding: 8,
  },
  imageOuter: {
    // Explicit full width: with a margin + aspectRatio, Yoga sized this box from its height
    // instead, leaving it narrower than the card and stuck to the left.
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageOuterGrid: {
    aspectRatio: 660 / 870,
  },
  imageOuterSingle: {
    aspectRatio: 3 / 2,
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.subtleFill,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotUpcoming: {
    backgroundColor: '#34D399',
  },
  dotPast: {
    backgroundColor: AppColors.textSecondary,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusLabelUpcoming: {
    color: '#34D399',
  },
  statusLabelPast: {
    color: AppColors.textSecondary,
  },
  dateSpacer: {
    flex: 1,
  },
  dateText: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
}));
