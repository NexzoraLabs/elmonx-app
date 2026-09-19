import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { AuthColors } from '@/constants/auth-colors';
import { isValidEmail, isValidPassword } from '@/utils/auth-validation';

export default function CreateAccountScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (!fullName.trim() || !username.trim()) {
      setError('Full name and username are required');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
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
    // TODO: replace with real sign-up API call once backend integration begins.
    setTimeout(() => {
      setLoading(false);
      router.push({ pathname: '/(auth)/verify-code', params: { email } });
    }, 400);
  };

  return (
    <AuthScreen header={<AuthHeader />}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Create your account to explore exclusive collectibles, save your favorites, and start
        building your collection.
      </Text>

      <View style={styles.form}>
        <AuthTextInput placeholder="Full Name" value={fullName} onChangeText={setFullName} textContentType="name" autoComplete="name" />
        <AuthTextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
        />
        <AuthTextInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />
        <AuthTextInput
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
        />
        <AuthTextInput
          placeholder="Create Password"
          value={password}
          onChangeText={setPassword}
          secureToggle
          textContentType="newPassword"
          autoComplete="new-password"
        />
        <AuthTextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureToggle
          textContentType="newPassword"
          autoComplete="new-password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AuthButton label="Continue" onPress={handleContinue} loading={loading} />

        <Text style={styles.terms}>
          By creating an account, you agree to our <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: AuthColors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    color: AuthColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  form: {
    marginTop: 28,
    gap: 20,
  },
  error: {
    color: AuthColors.danger,
    fontSize: 13,
  },
  terms: {
    color: AuthColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  link: {
    color: AuthColors.link,
  },
});
