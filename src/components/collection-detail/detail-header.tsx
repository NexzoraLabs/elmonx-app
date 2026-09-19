import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

export function DetailHeader() {
  const [saved, setSaved] = useState(false);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => router.back()}
        style={styles.button}>
        <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="View in AR" hitSlop={8} style={styles.button}>
          <Ionicons name="cube-outline" size={18} color={AppColors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save"
          hitSlop={8}
          onPress={() => setSaved((prev) => !prev)}
          style={styles.button}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={AppColors.textPrimary}
          />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Share" hitSlop={8} style={styles.button}>
          <Ionicons name="share-outline" size={18} color={AppColors.textPrimary} />
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
  actions: {
    flexDirection: 'row',
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
