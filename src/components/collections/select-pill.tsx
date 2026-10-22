import { Pressable, Text } from 'react-native';

import { makeStyles } from '@/context/theme-context';

type SelectPillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectPill({ label, selected, onPress }: SelectPillProps) {
  const styles = useStyles();
  return (
    <Pressable style={[styles.pill, selected && styles.pillSelected]} onPress={onPress}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
