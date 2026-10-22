import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { PhoneNumberField } from '@/components/forms/phone-number-field';
import { makeStyles } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { isValidEmail, isValidPassword } from '@/utils/auth-validation';
import { dialCodeOf, phoneValidationError } from '@/services/phone';
import { useTranslation } from 'react-i18next';

export default function CreateAccountScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  // Website sign-up defaults to Pakistan (intl-tel-input initialCountry: 'pk').
  const [phoneIso, setPhoneIso] = useState('pk');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const nameParts = fullName.trim().split(/\s+/);
    if (!fullName.trim() || !username.trim() || nameParts.length < 2) {
      setError(t('Enter your full name (first and last) and a username'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('Enter a valid email address'));
      return;
    }
    if (!phone.trim()) {
      setError(t('Enter your phone number'));
      return;
    }
    const phoneError = phoneValidationError(phone, phoneIso);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (!isValidPassword(password)) {
      setError(t('Password must be at least 8 characters'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('Passwords do not match'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const [firstName, ...rest] = nameParts;
      await signUp({
        firstName,
        lastName: rest.join(' '),
        userName: username.trim(),
        emailAddress: email.trim(),
        password,
        phoneNumber: phone.trim(),
        countryCode: dialCodeOf(phoneIso),
        isoCode: phoneIso,
      });
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Unable to create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen header={<AuthHeader />}>
      <Text style={styles.title}>{t('Create Account')}</Text>
      <Text style={styles.subtitle}>
        {t('Create your account to explore exclusive collectibles, save your favorites, and start building your collection.')}
      </Text>

      <View style={styles.form}>
        <AuthTextInput placeholder={t('Full Name')} value={fullName} onChangeText={setFullName} textContentType="name" autoComplete="name" />
        <AuthTextInput
          placeholder={t('Username')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
        />
        <AuthTextInput
          placeholder={t('Email address')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />
        <PhoneNumberField
          variant="underline"
          iso2={phoneIso}
          onIso2Change={setPhoneIso}
          number={phone}
          onNumberChange={setPhone}
        />
        <AuthTextInput
          placeholder={t('Create Password')}
          value={password}
          onChangeText={setPassword}
          secureToggle
          textContentType="newPassword"
          autoComplete="new-password"
        />
        <AuthTextInput
          placeholder={t('Confirm Password')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureToggle
          textContentType="newPassword"
          autoComplete="new-password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AuthButton label={t('Continue')} onPress={handleContinue} loading={loading} />

        <Text style={styles.terms}>
          {t('By creating an account, you agree to our')}{' '}<Text style={styles.link}>{t('Terms of Service')}</Text>{' '}{t('and')}{' '}
          <Text style={styles.link}>{t('Privacy Policy')}</Text>.
        </Text>
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
  terms: {
    color: AppColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  link: {
    color: AppColors.link,
  },
}));
