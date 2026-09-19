import { Pressable, StyleSheet, Text } from 'react-native';

import { PlaceholderThumb } from '@/components/home/placeholder-thumb';
import { AppColors } from '@/constants/app-colors';

export function CreatePostPrompt({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}>
      <PlaceholderThumb color="#5A4FA0" icon="person-outline" style={styles.avatar} iconSize={16} />
      <Text style={styles.placeholder}>What&apos;s new?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholder: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
});
