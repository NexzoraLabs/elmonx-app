import { StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { ArPhotoItem } from '@/data/home-mock';

export function ArPhotoTile({ item }: { item: ArPhotoItem }) {
  return (
    <View style={styles.card}>
      <PlaceholderThumb color={item.color} icon="camera-outline" style={styles.thumb} />
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.time}>{item.timeAgo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  time: {
    color: AppColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});
