import { Text, View } from 'react-native';

import type { AppColor } from '@/constants/app-colors';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

type Rarity = 'common' | 'rare' | 'ultraRare';

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  ultraRare: 'Ultra Rare',
};

const RARITY_COLOR: Record<Rarity, AppColor> = {
  common: 'rarityCommon',
  rare: 'rarityRare',
  ultraRare: 'rarityUltraRare',
};

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  return (
    <View style={[styles.badge, { backgroundColor: AppColors[RARITY_COLOR[rarity]] }]}>
      <Text style={styles.label}>{t(RARITY_LABEL[rarity])}</Text>
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
    color: AppColors.onMedia,
    fontSize: 10,
    fontWeight: '700',
  },
}));
