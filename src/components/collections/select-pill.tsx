import { Pressable, StyleSheet, Text } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type SelectPillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectPill({ label, selected, onPress }: SelectPillProps) {
  return (
    <Pressable style={[styles.pill, selected && styles.pillSelected]} onPress={onPress}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pillSelected: {
    backgroundColor: AppColors.border,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  labelSelected: {
    color: AppColors.textPrimary,
    fontWeight: '700',
  },
});
