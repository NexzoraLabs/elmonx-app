import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type AuthButtonVariant = 'primary' | 'secondary';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  variant?: AuthButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
};

export function AuthButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: AuthButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        isDisabled && isPrimary && styles.primaryDisabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? AppColors.buttonPrimaryText : AppColors.buttonSecondaryText}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              isPrimary ? styles.primaryLabel : styles.secondaryLabel,
              isDisabled && isPrimary && styles.primaryLabelDisabled,
            ]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  primaryDisabled: {
    backgroundColor: AppColors.buttonDisabledBg,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppColors.buttonSecondaryBorder,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryLabel: {
    color: AppColors.buttonPrimaryText,
  },
  primaryLabelDisabled: {
    color: AppColors.buttonDisabledText,
  },
  secondaryLabel: {
    color: AppColors.buttonSecondaryText,
  },
});
