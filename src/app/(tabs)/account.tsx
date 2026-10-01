import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountSection } from '@/components/account/account-section';
import { StatCard } from '@/components/account/stat-card';
import { UserAvatar } from '@/components/account/user-avatar';
import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import { ACCOUNT_SECTIONS } from '@/data/account-menu';

const ROW_ROUTES: Record<string, Href> = {
  'personal-information': '/personal-info',
  settings: '/settings',
  'app-rewards': '/rewards',
  challenges: '/challenges',
  leaderboard: '/leaderboard',
  'shipping-address': '/shipping-address',
  'promo-code': '/promo-code',
  'my-vault-collectables': { pathname: '/collectibles', params: { tab: 'app' } },
  'my-wallet-collectables': { pathname: '/collectibles', params: { tab: 'web' } },
  'doodles-physicals': '/doodles-physicals',
};

export default function AccountScreen() {
  const { user, signOut } = useAuth();

  const handlePressRow = (key: string) => {
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
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Account</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Personal information"
          hitSlop={8}
          onPress={() => router.push('/personal-info')}
          style={({ pressed }) => pressed && styles.pressed}>
          <UserAvatar user={user} size={36} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <StatCard
            icon="diamond-outline"
            iconColor={AppColors.rarityRare}
            label="Total Rewards Earned"
            value="20.00"
          />
          <StatCard
            icon="logo-bitcoin"
            iconColor={AppColors.gold}
            label="Wallet Balance"
            value="99.99"
          />
        </View>

        {ACCOUNT_SECTIONS.map((section) => (
          <AccountSection key={section.title} section={section} onPressRow={handlePressRow} />
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
              accessibilityLabel="Log out"
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
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
});
