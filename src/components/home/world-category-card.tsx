import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AppColors } from '@/constants/app-colors';
import type { WorldCategory } from '@/data/home-mock';

export function WorldCategoryCard({ item }: { item: WorldCategory }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Ionicons name={item.icon} size={18} color={AppColors.textPrimary} />
      <Text style={styles.label} numberOfLines={1}>
        {item.label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={AppColors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
});
