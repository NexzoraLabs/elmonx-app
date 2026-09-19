import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { RarityBadge } from '@/components/home/rarity-badge';
import { AppColors } from '@/constants/app-colors';
import type { CollectibleItem } from '@/data/home-mock';

export function CollectibleCard({ item }: { item: CollectibleItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.thumbWrapper}>
        <RarityBadge rarity={item.rarity} />
        <PlaceholderThumb color={item.color} icon="diamond-outline" style={styles.thumb} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.date}>{item.date}</Text>
      <View style={styles.priceRow}>
        <Ionicons name="logo-bitcoin" size={14} color={AppColors.gold} />
        <Text style={styles.price}>{item.price}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
  },
  thumbWrapper: {
    width: '100%',
    aspectRatio: 1,
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  price: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});
