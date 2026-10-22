import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountSection } from '@/components/account/account-section';
import { UserAvatar } from '@/components/account/user-avatar';
import { HomeHeader } from '@/components/home/home-header';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { ACCOUNT_SECTIONS } from '@/data/account-menu';
import { useMultiViewer } from '@/hooks/use-multi-viewer';
import { useTranslation } from 'react-i18next';

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
};

export default function AccountScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { user, signOut } = useAuth();
  const multiViewer = useMultiViewer();
  const handlePressRow = (key: string) => {
    if (key === 'multi-viewer') {
      multiViewer.open();
      return;
    }
    const route = ROW_ROUTES[key];
    if (route) router.push(route);
    // TODO: wire up remaining destinations once those screens are designed.
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
        {ACCOUNT_SECTIONS.map((section) => (
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
