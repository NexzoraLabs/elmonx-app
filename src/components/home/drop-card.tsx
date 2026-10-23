import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { openGridItem } from '@/components/collections/open-grid-item';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { makeStyles, useAppColors } from '@/context/theme-context';
import type { CollectionGridItem } from '@/data/collections';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

export function DropCard({ item }: { item: CollectionGridItem }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <Pressable
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => openGridItem(item)}>
      <View style={styles.imageOuter}>
        {item.imageUrl ? (
          <Image cachePolicy="memory-disk"
            source={{ uri: item.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <PlaceholderThumb color={item.color} icon="sparkles-outline" iconSize={28} style={StyleSheet.absoluteFill} />
        )}
        {item.isUpcoming ? (
          <View style={styles.upcomingBadge}>
            <View style={styles.upcomingDot} />
            <Text style={styles.upcomingText}>{t('Upcoming')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title.toUpperCase()}
          </Text>
        </View>
        {item.dropDate ? (
          <View style={styles.dateRow}>
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
    width: CARD_WIDTH,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  imageOuter: {
    margin: 8,
    aspectRatio: 660 / 870,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
  },
  upcomingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  upcomingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  upcomingText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 5,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: AppColors.textSecondary,
    fontSize: 11,
  },
}));
