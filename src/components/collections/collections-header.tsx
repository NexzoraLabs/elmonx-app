import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

export function CollectionsHeader() {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>Collections</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" hitSlop={8} style={styles.button}>
          <Ionicons name="search-outline" size={18} color={AppColors.textPrimary} />
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={8} style={styles.button}>
          <Ionicons name="options-outline" size={18} color={AppColors.textPrimary} />
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={8} style={styles.button}>
          <Ionicons name="filter-outline" size={18} color={AppColors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
