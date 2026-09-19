import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { CountdownPill } from '@/components/home/countdown-badge';
import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { LeavingSoonItem } from '@/data/home-mock';

export function LeavingSoonCard({ item }: { item: LeavingSoonItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.thumbWrapper}>
        <CountdownPill targetMs={item.endsAt} />
        <PlaceholderThumb color={item.color} icon="hourglass-outline" style={styles.thumb} />
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
    width: 150,
  },
  thumbWrapper: {
    width: 150,
    height: 150,
  },
  thumb: {
    width: 150,
    height: 150,
    borderRadius: 16,
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
