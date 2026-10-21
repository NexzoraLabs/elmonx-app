import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { CollectionGridItem } from '@/data/collections-mock';

export function FeaturedDropCard({ item }: { item: CollectionGridItem }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/drop/[id]', params: { id: item.id } })}>
      <View style={styles.imageOuter}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <PlaceholderThumb color={item.color} icon="body-outline" iconSize={28} style={StyleSheet.absoluteFill} />
        )}
      </View>

      <View style={styles.body}>
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
        {item.dropDate ? (
          <View style={styles.dateBar}>
            <Ionicons name="calendar-outline" size={11} color={AppColors.textSecondary} />
            <Text style={styles.dateText}>{item.dropDate}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 6,
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
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  arrowIcon: {
    transform: [{ rotate: '-45deg' }],
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  dateText: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
