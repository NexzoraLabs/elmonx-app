import { Pressable, StyleSheet, Text } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
  },
  chipActive: {
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: AppColors.buttonPrimaryText,
  },
});
