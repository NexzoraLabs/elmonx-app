import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type AuthCheckboxProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
};

export function AuthCheckbox({ checked, onChange, label }: AuthCheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.row}
      onPress={() => onChange(!checked)}
      hitSlop={8}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={14} color={AppColors.buttonPrimaryText} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.buttonSecondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: AppColors.buttonPrimaryBg,
    borderColor: AppColors.buttonPrimaryBg,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
});
