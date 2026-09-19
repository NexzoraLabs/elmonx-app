import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

/**
 * Placeholder for the Figma hero illustration (fanned collectible cards).
 * Swap for the exported artwork once available.
 */
export function CollectibleHero() {
  return (
    <View style={styles.container}>
      <View style={[styles.sideCard, styles.leftCard]} />
      <View style={[styles.sideCard, styles.rightCard]} />
      <View style={styles.centerCard}>
        <View style={styles.centerCardInner}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            T206 Honus Wagner
          </Text>
          <Text style={styles.cardSubtitle}>PR 1</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideCard: {
    position: 'absolute',
    width: 120,
    height: 170,
    borderRadius: 14,
  },
  leftCard: {
    backgroundColor: '#7B3FF2',
    transform: [{ rotate: '-14deg' }, { translateX: -70 }],
  },
  rightCard: {
    backgroundColor: '#2AB3A6',
    transform: [{ rotate: '14deg' }, { translateX: 70 }],
  },
  centerCard: {
    width: 140,
    height: 190,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 10,
  },
  centerCardInner: {
    alignItems: 'center',
  },
  cardTitle: {
    color: AppColors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});
