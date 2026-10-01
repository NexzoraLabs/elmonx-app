import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { isValidPassword } from '@/utils/auth-validation';

export default function ResetPasswordScreen() {
  const { email, code } = useLocalSearchParams<{ email?: string; code?: string }>();
  const { confirmPasswordReset } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!email || !code) {
      setError('Missing verification details — please restart the reset process.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(email, code, password);
      router.replace('/(auth)/sign-in');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen header={<AuthHeader title="Reset Password" />}>
      <Text style={styles.title}>Set a New Password</Text>
      <Text style={styles.subtitle}>Choose a new password for your account.</Text>

      <View style={styles.form}>
        <AuthTextInput
          placeholder="New Password"
          value={password}
          onChangeText={setPassword}
          secureToggle
          textContentType="newPassword"
          autoComplete="new-password"
        />
        <AuthTextInput
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureToggle
          textContentType="newPassword"
          autoComplete="new-password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AuthButton label="Save Password" onPress={handleSave} loading={loading} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: AppColors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  form: {
    marginTop: 28,
    gap: 20,
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
  },
});
