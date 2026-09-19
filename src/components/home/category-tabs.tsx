import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type CategoryTabsProps = {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
};

export function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {categories.map((category) => {
        const isActive = category === selected;
        return (
          <Pressable key={category} onPress={() => onSelect(category)} hitSlop={4}>
            <Text style={[styles.label, isActive && styles.labelActive]}>{category}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: AppColors.textPrimary,
  },
});
