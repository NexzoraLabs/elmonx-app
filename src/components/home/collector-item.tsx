import { StyleSheet, Text, View } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';
import type { CollectorItem } from '@/data/home-mock';

export function CollectorTile({ item }: { item: CollectorItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatarWrapper}>
        <PlaceholderThumb color={item.color} icon="person-outline" style={styles.avatar} />
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{item.level}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.reward}>Reward {item.rewardXp} xp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 88,
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 64,
    height: 64,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: AppColors.gold,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: AppColors.background,
  },
  levelText: {
    color: '#0A0A0B',
    fontSize: 10,
    fontWeight: '800',
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  reward: {
    color: AppColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});
