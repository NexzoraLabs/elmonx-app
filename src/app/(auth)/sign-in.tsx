import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthCheckbox } from '@/components/auth/auth-checkbox';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { SocialButton } from '@/components/auth/social-button';
import { AppColors } from '@/constants/app-colors';

export default function SignInScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (identifier.trim().length === 0) {
      setError('Enter your email or username');
      return;
    }
    if (password.length === 0) {
      setError('Enter your password');
      return;
    }
    setError(null);
    setLoading(true);
    // TODO: replace with real sign-in API call once backend integration begins.
    setTimeout(() => {
      setLoading(false);
      router.replace('/home');
    }, 400);
  };

  return (
    <AuthScreen header={<AuthHeader />}>
      <Text style={styles.title}>Sign In to ElmonX</Text>
      <Text style={styles.subtitle}>
        Sign in to explore exclusive collections and never miss new releases.
      </Text>

      <View style={styles.form}>
        <AuthTextInput
          placeholder="Email or Username"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          autoComplete="username"
        />

        <AuthTextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureToggle
          textContentType="password"
          autoComplete="password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.row}>
          <AuthCheckbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />
          <Text style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
            Forgot password?
          </Text>
        </View>

        <AuthButton label="Continue" onPress={handleContinue} loading={loading} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <SocialButton provider="google" onPress={() => {}} />
        <SocialButton provider="apple" onPress={() => {}} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotLink: {
    color: AppColors.link,
    fontSize: 13,
    fontWeight: '500',
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
    marginTop: -8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.border,
  },
  dividerText: {
    color: AppColors.textSecondary,
    fontSize: 12,
  },
});
