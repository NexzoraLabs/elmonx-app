import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthCheckbox } from '@/components/auth/auth-checkbox';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { SocialButton } from '@/components/auth/social-button';
import { makeStyles } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from 'react-i18next';

export default function SignInScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const { signIn, signInWithWeb } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [webLoading, setWebLoading] = useState(false);

  const handleContinue = async () => {
    if (identifier.trim().length === 0) {
      setError(t('Enter your email or username'));
      return;
    }
    if (password.length === 0) {
      setError(t('Enter your password'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const emailAddress = await signIn(identifier.trim(), password);
      router.push({ pathname: '/(auth)/verify-code', params: { email: emailAddress, purpose: 'login' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Unable to sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Google and Apple both run through the website's sign-in page (system browser sheet), so the
  // app needs no native Google/Apple SDK. See services/web-auth.ts.
  const handleWebSignIn = async () => {
    if (webLoading) return;
    setError(null);
    setWebLoading(true);
    try {
      if (await signInWithWeb()) router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Unable to sign in. Please try again.'));
    } finally {
      setWebLoading(false);
    }
  };

  return (
    <AuthScreen header={<AuthHeader />}>
      <Text style={styles.title}>{t('Sign In to ElmonX')}</Text>
      <Text style={styles.subtitle}>
        {t('Sign in to explore exclusive collections and never miss new releases.')}
      </Text>

      <View style={styles.form}>
        <AuthTextInput
          placeholder={t('Email or Username')}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          autoComplete="username"
        />

        <AuthTextInput
          placeholder={t('Password')}
          value={password}
          onChangeText={setPassword}
          secureToggle
          textContentType="password"
          autoComplete="password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.row}>
          <AuthCheckbox checked={rememberMe} onChange={setRememberMe} label={t('Remember me')} />
          <Text style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
            {t('Forgot password?')}
          </Text>
        </View>

        <AuthButton label={t('Continue')} onPress={handleContinue} loading={loading} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('OR')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <SocialButton provider="google" onPress={handleWebSignIn} disabled={webLoading} />
        <SocialButton provider="apple" onPress={handleWebSignIn} disabled={webLoading} />
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
}));
