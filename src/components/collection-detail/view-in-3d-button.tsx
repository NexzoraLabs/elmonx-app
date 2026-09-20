import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

export function ViewIn3DButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.button} onPress={onPress} accessibilityRole="button">
        <Ionicons name="cube-outline" size={18} color={AppColors.textPrimary} />
        <Text style={styles.label}>View in 3D</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
