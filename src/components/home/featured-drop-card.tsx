import { StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { FeaturedDropItem } from '@/data/home-mock';

export function FeaturedDropCard({ item }: { item: FeaturedDropItem }) {
  return (
    <View style={styles.card}>
      <PlaceholderThumb color={item.color} icon="body-outline" style={styles.thumb} />
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.date}>{item.date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
  },
  thumb: {
    width: 120,
    height: 140,
    borderRadius: 14,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  date: {
    color: AppColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
