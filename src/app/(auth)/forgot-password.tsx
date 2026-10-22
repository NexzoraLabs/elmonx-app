import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { makeStyles } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { isValidEmail } from '@/utils/auth-validation';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!isValidEmail(email)) {
      setError(t('Enter a valid email address'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
      router.push({ pathname: '/(auth)/verify-code', params: { email: email.trim(), purpose: 'reset' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Unable to send reset code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen header={<AuthHeader title={t('Forgot Password')} />}>
      <Text style={styles.title}>{t('Reset Your Password')}</Text>
      <Text style={styles.subtitle}>
        {t('Provide your registered email address to receive a secure password reset link.')}
      </Text>

      <View style={styles.form}>
        <AuthTextInput
          placeholder={t('Email address')}
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
        {sent ? <Text style={styles.success}>{t('Reset link sent — check your inbox.')}</Text> : null}

        <AuthButton label={t('Send')} onPress={handleSend} loading={loading} />
      </View>
    </AuthScreen>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
