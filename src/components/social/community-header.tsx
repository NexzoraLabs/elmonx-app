import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

export function CommunityHeader({ onPressCompose }: { onPressCompose: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>Community</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create post"
        hitSlop={8}
        onPress={onPressCompose}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Ionicons name="add" size={20} color={AppColors.textPrimary} />
      </Pressable>
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
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
