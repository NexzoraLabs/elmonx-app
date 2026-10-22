import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { CollectibleHero } from '@/components/auth/collectible-hero';
import { LogoMark } from '@/components/auth/logo-mark';
import { makeStyles } from '@/context/theme-context';
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <AuthScreen
      scrollable={false}
      footer={
        <View style={styles.footer}>
          <AuthButton label={t('Create an account')} onPress={() => router.push('/(auth)/create-account')} />

          <Text style={styles.terms}>
            {t('By continuing, you agree to our')}{' '}<Text style={styles.link}>{t('terms')}</Text>,{' '}
            <Text style={styles.link}>{t('Privacy Policy')}</Text>{' '}{t('and')}{' '}<Text style={styles.link}>{t('Cookie Use')}</Text>.
          </Text>

          <AuthButton
            label={t('Login with email')}
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
        <Text style={styles.title}>{t('Welcome to ElmonX')}</Text>
        <Text style={styles.subtitle}>
          {t('Explore exclusive collections, discover new drops, and start building your digital collection.')}
        </Text>
      </View>
    </AuthScreen>
  );
}

const useStyles = makeStyles((AppColors) => ({
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
}));
