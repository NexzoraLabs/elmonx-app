import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { CollectibleHero } from '@/components/auth/collectible-hero';
import { LogoMark } from '@/components/auth/logo-mark';
import { AppColors } from '@/constants/app-colors';

export default function WelcomeScreen() {
  return (
    <AuthScreen
      scrollable={false}
      footer={
        <View style={styles.footer}>
          <AuthButton label="Create an account" onPress={() => router.push('/(auth)/create-account')} />

          <Text style={styles.terms}>
            By continuing, you agree to our <Text style={styles.link}>terms</Text>,{' '}
            <Text style={styles.link}>Privacy Policy</Text> and <Text style={styles.link}>Cookie Use</Text>.
          </Text>

          <AuthButton
            label="Login with email"
            variant="secondary"
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </View>
      }>
      <View style={styles.logoRow}>
        <LogoMark />
      </View>

      <View style={styles.heroSection}>
        <CollectibleHero />
      </View>

      <View style={styles.copySection}>
        <Text style={styles.title}>Welcome to ElmonX</Text>
        <Text style={styles.subtitle}>
          Explore exclusive collections, discover new drops, and start building your digital
          collection.
        </Text>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    alignItems: 'center',
    paddingTop: 16,
  },
  heroSection: {
    marginTop: 32,
  },
  copySection: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: AppColors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  footer: {
    gap: 16,
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
});
