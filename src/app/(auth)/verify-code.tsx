import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthScreen } from '@/components/auth/auth-screen';
import { NumericKeypad } from '@/components/auth/numeric-keypad';
import { OtpInput } from '@/components/auth/otp-input';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';

const CODE_LENGTH = 4;
const RESEND_SECONDS = 24;

export default function VerifyCodeScreen() {
  const { email, purpose } = useLocalSearchParams<{ email?: string; purpose?: 'login' | 'reset' }>();
  const { confirmSignInOtp, resendOtp } = useAuth();
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const isComplete = code.length === CODE_LENGTH;

  const handlePressDigit = (digit: string) => {
    setError(null);
    setCode((prev) => (prev.length >= CODE_LENGTH ? prev : prev + digit));
  };

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || !email) return;
    setSecondsLeft(RESEND_SECONDS);
    setCode('');
    setError(null);
    try {
      await resendOtp(email);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to resend code.');
    }
  };

  const handleContinue = async () => {
    if (!isComplete || !email) return;
    setVerifying(true);
    setError(null);
    try {
      if (purpose === 'reset') {
        router.push({ pathname: '/(auth)/reset-password', params: { email, code } });
        return;
      }
      await confirmSignInOtp(email, code);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid or expired code.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AuthScreen
      header={<AuthHeader />}
      scrollable={false}
      footer={
        <AuthButton
          label="Continue"
          onPress={handleContinue}
          disabled={!isComplete}
          loading={verifying}
        />
      }>
      <Text style={styles.title}>Enter the code we sent you</Text>
      <Text style={styles.subtitle}>
        We sent it to <Text style={styles.emailText}>{email ?? 'your email'}</Text> to verify
      </Text>

      <View style={styles.otpSection}>
        <OtpInput length={CODE_LENGTH} value={code} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.resendText}>
        Don&apos;t see it?{' '}
        {secondsLeft > 0 ? (
          `Retry in ${secondsLeft} seconds`
        ) : (
          <Text style={styles.resendLink} onPress={handleResend}>
            Resend code
          </Text>
        )}
      </Text>

      <View style={styles.keypadSection}>
        <NumericKeypad onPressDigit={handlePressDigit} onBackspace={handleBackspace} />
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
  emailText: {
    color: AppColors.textPrimary,
  },
  otpSection: {
    marginTop: 32,
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
    marginTop: 12,
  },
  resendText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 20,
  },
  resendLink: {
    color: AppColors.link,
    fontWeight: '600',
  },
  keypadSection: {
    marginTop: 'auto',
    paddingBottom: 8,
  },
});
