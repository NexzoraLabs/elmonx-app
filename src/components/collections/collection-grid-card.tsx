import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { CollectionGridItem } from '@/data/collections-mock';

type CollectionGridCardProps = {
  item: CollectionGridItem;
  layout?: 'single' | 'grid';
};

export function CollectionGridCard({ item, layout = 'grid' }: CollectionGridCardProps) {
  const isSingle = layout === 'single';

  return (
    <View style={[styles.card, isSingle ? styles.cardSingle : styles.cardGrid]}>
      <View style={[styles.thumbWrapper, isSingle ? styles.thumbSingle : styles.thumbGrid]}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.thumb}
            contentFit="contain"
            transition={150}
          />
        ) : (
          <PlaceholderThumb color={item.color} icon="image-outline" style={styles.thumb} />
        )}
        {item.dismissible ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            hitSlop={8}
            style={styles.dismissButton}>
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.date}>Drop Date : {item.dropDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // width is set per-layout below
  },
  cardGrid: {
    width: '48%',
  },
  cardSingle: {
    width: '100%',
  },
  thumbWrapper: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: AppColors.surface,
    overflow: 'hidden',
  },
  thumbGrid: {
    aspectRatio: 0.85,
  },
  thumbSingle: {
    aspectRatio: 1.6,
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  date: {
    color: AppColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
