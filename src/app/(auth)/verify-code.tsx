import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthScreen } from '@/components/auth/auth-screen';
import { NumericKeypad } from '@/components/auth/numeric-keypad';
import { OtpInput } from '@/components/auth/otp-input';
import { AppColors } from '@/constants/app-colors';

const CODE_LENGTH = 4;
const RESEND_SECONDS = 24;

export default function VerifyCodeScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const isComplete = code.length === CODE_LENGTH;

  const handlePressDigit = (digit: string) => {
    setCode((prev) => (prev.length >= CODE_LENGTH ? prev : prev + digit));
  };

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
    setCode('');
    // TODO: trigger real resend-code API call once backend integration begins.
  };

  const handleContinue = () => {
    if (!isComplete) return;
    setVerifying(true);
    // TODO: replace with real code-verification API call once backend integration begins.
    setTimeout(() => {
      setVerifying(false);
      router.replace('/home');
    }, 400);
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
