import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type CategoryTabsProps = {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
  underline?: boolean;
};

export function CategoryTabs({ categories, selected, onSelect, underline }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {categories.map((category) => {
        const isActive = category === selected;
        return (
          <Pressable key={category} onPress={() => onSelect(category)} hitSlop={4} style={styles.tab}>
            <Text style={[styles.label, isActive && styles.labelActive]}>{category}</Text>
            {underline ? (
              <View style={[styles.underline, isActive && styles.underlineActive]} />
            ) : null}
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
  tab: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: AppColors.textPrimary,
  },
  underline: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: AppColors.textPrimary,
  },
});
