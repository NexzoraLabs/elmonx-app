import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { CollectionGridItem } from '@/data/collections-mock';

export function CollectionGridCard({ item }: { item: CollectionGridItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.thumbWrapper}>
        <PlaceholderThumb color={item.color} icon="image-outline" style={styles.thumb} />
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
    width: '48%',
  },
  thumbWrapper: {
    width: '100%',
    aspectRatio: 0.85,
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
