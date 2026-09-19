import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { RarityBadge } from '@/components/home/rarity-badge';
import { AppColors } from '@/constants/app-colors';

type BlindBoxItemCardProps = {
  title: string;
  date: string;
  price: string;
  rarity: 'common' | 'rare' | 'ultraRare';
  color: string;
  imageUrl?: string;
};

export function BlindBoxItemCard({ title, date, price, rarity, color, imageUrl }: BlindBoxItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.thumbWrapper}>
        <RarityBadge rarity={rarity} />
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumb} contentFit="contain" transition={150} />
        ) : (
          <PlaceholderThumb color={color} icon="image-outline" style={styles.thumb} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>{date}</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>Price</Text>
          <View style={styles.priceRow}>
            <Ionicons name="logo-bitcoin" size={12} color={AppColors.gold} />
            <Text style={styles.metaValue}>{price}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
  },
  thumbWrapper: {
    width: 140,
    height: 140,
    borderRadius: 14,
    backgroundColor: AppColors.surface,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaLabel: {
    color: AppColors.textSecondary,
    fontSize: 10,
  },
  metaValue: {
    color: AppColors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
});
