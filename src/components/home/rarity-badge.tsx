import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type Rarity = 'common' | 'rare' | 'ultraRare';

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  ultraRare: 'Ultra Rare',
};

const RARITY_COLOR: Record<Rarity, string> = {
  common: AppColors.rarityCommon,
  rare: AppColors.rarityRare,
  ultraRare: AppColors.rarityUltraRare,
};

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <View style={[styles.badge, { backgroundColor: RARITY_COLOR[rarity] }]}>
      <Text style={styles.label}>{RARITY_LABEL[rarity]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 1,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
});
