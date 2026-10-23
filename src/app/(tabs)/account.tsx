import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountSection } from '@/components/account/account-section';
import { UserAvatar } from '@/components/account/user-avatar';
import { HomeHeader } from '@/components/home/home-header';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { ACCOUNT_SECTIONS, UK_VERIFICATION_ROW, type AccountSection as AccountSectionData } from '@/data/account-menu';
import { useMultiViewer } from '@/hooks/use-multi-viewer';
import { useTranslation } from 'react-i18next';
import { getUkStatus } from '@/services/uk-verification-api';

const ROW_ROUTES: Record<string, Href> = {
  'personal-information': '/personal-info',
  settings: '/settings',
  language: '/language',
  'app-rewards': '/rewards',
  challenges: '/challenges',
  leaderboard: '/leaderboard',
  'shipping-address': '/shipping-address',
  'promo-code': '/promo-code',
  'my-wallet': '/wallet',
  'my-collectables': '/collectibles',
  'doodles-physicals': '/doodles-physicals',
  connections: '/connections',
  'uk-verification': '/uk-verification',
};

export default function AccountScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { user, token, signOut } = useAuth();
  const multiViewer = useMultiViewer();
  // Website account page: UK residents get a "UK Verification" entry, and a compliance alert until
  // they've filled it in (checked again whenever the screen is shown, e.g. after saving the form).
  const [uk, setUk] = useState({ isUk: false, verified: true });

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let active = true;
      getUkStatus(token)
        .then((status) => active && setUk(status))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [token])
  );

  const sections: AccountSectionData[] = uk.isUk
    ? ACCOUNT_SECTIONS.map((section, index) => (index === 0 ? { ...section, rows: [...section.rows, UK_VERIFICATION_ROW] } : section))
    : ACCOUNT_SECTIONS;

  const handlePressRow = (key: string) => {
    if (key === 'multi-viewer') {
      multiViewer.open();
      return;
    }
    const route = ROW_ROUTES[key];
    if (route) router.push(route);
  };

  const handleLogOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Main app header, with a back button in place of the menu + wordmark. */}
      <HomeHeader variant="back" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {uk.isUk && !uk.verified ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/uk-verification')}
            style={({ pressed }) => [styles.ukAlert, pressed && styles.pressed]}>
            <Ionicons name="alert-circle-outline" size={18} color={AppColors.gold} />
            <Text style={styles.ukAlertText}>
              {t(
                'In accordance with new UK compliance regulations, residents are required to complete a short form to verify their details before continuing with purchases.'
              )}
            </Text>
          </Pressable>
        ) : null}

        {sections.map((section) => (
          <AccountSection
            key={section.title}
            section={section}
            onPressRow={handlePressRow}
            loadingKey={multiViewer.loading ? 'multi-viewer' : undefined}
          />
        ))}

        {user ? (
          <View style={styles.userRow}>
            <UserAvatar user={user} size={40} />
            <View style={styles.userText}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.user_name}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email_address}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Log out')}
              hitSlop={10}
              style={({ pressed }) => [styles.logOutButton, pressed && styles.pressed]}
              onPress={handleLogOut}>
              <Ionicons name="log-out-outline" size={22} color={AppColors.danger} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((AppColors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  ukAlert: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(234,179,8,0.15)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  ukAlertText: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
    paddingTop: 16,
  },
  userText: {
    flex: 1,
  },
  userName: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  userEmail: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  logOutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
  },
}));
