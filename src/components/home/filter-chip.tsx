import { Pressable, Text } from 'react-native';

import { makeStyles } from '@/context/theme-context';

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  const styles = useStyles();
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
