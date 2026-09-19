import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AuthColors } from '@/constants/auth-colors';

type AuthTextInputProps = TextInputProps & {
  secureToggle?: boolean;
  error?: string;
};

export const AuthTextInput = forwardRef<TextInput, AuthTextInputProps>(function AuthTextInput(
  { secureToggle, secureTextEntry, error, style, onFocus, onBlur, ...props },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHidden, setIsHidden] = useState(secureToggle ?? secureTextEntry ?? false);

  return (
    <View>
      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          error && styles.containerError,
        ]}>
        <TextInput
          ref={ref}
          placeholderTextColor={AuthColors.textPlaceholder}
          style={[styles.input, style]}
          secureTextEntry={secureToggle ? isHidden : secureTextEntry}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {secureToggle ? (
          <Pressable hitSlop={12} onPress={() => setIsHidden((prev) => !prev)}>
            <Ionicons
              name={isHidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={AuthColors.iconMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: AuthColors.border,
    paddingVertical: 12,
    gap: 8,
  },
  containerFocused: {
    borderBottomColor: AuthColors.borderFocused,
  },
  containerError: {
    borderBottomColor: AuthColors.danger,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AuthColors.textPrimary,
    padding: 0,
  },
});
