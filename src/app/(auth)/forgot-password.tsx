import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { AppColors } from '@/constants/app-colors';
import { isValidEmail } from '@/utils/auth-validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    setLoading(true);
    // TODO: replace with real password-reset API call once backend integration begins.
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 400);
  };

  return (
    <AuthScreen header={<AuthHeader title="Forgot Password" />}>
      <Text style={styles.title}>Reset Your Password</Text>
      <Text style={styles.subtitle}>
        Provide your registered email address to receive a secure password reset link.
      </Text>

      <View style={styles.form}>
        <AuthTextInput
          placeholder="Email address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setSent(false);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sent ? <Text style={styles.success}>Reset link sent — check your inbox.</Text> : null}

        <AuthButton label="Send" onPress={handleSend} loading={loading} />
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
  success: {
    color: AppColors.success,
    fontSize: 13,
  },
});
