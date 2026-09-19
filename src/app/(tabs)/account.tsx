import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountSection } from '@/components/account/account-section';
import { StatCard } from '@/components/account/stat-card';
import { AppColors } from '@/constants/app-colors';
import { ACCOUNT_SECTIONS } from '@/data/account-menu';

export default function AccountScreen() {
  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>({ 'dark-mode': true });

  const handlePressRow = (_key: string) => {
    // TODO: wire up destinations once those screens are designed.
  };

  const handleToggleChange = (key: string, value: boolean) => {
    setToggleValues((prev) => ({ ...prev, [key]: value }));
    // TODO: wire up real light/dark theme switching once a light theme exists.
  };

  const handleLogOut = () => {
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
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <StatCard
            icon="diamond-outline"
            iconColor={AppColors.rarityRare}
            label="Total Rewards Earned"
            value="20.00"
            delta="+4.00 Today"
          />
          <StatCard
            icon="logo-bitcoin"
            iconColor={AppColors.gold}
            label="Wallet Balance"
            value="99.99"
          />
        </View>

        {ACCOUNT_SECTIONS.map((section) => (
          <AccountSection
            key={section.title}
            section={section}
            onPressRow={handlePressRow}
            toggleValues={toggleValues}
            onToggleChange={handleToggleChange}
          />
        ))}

        <View style={styles.logOutSection}>
          <Text style={styles.title}>SESSION</Text>
          <Pressable
            style={({ pressed }) => [styles.logOutRow, pressed && styles.pressed]}
            onPress={handleLogOut}>
            <Ionicons name="log-out-outline" size={20} color={AppColors.danger} />
            <Text style={styles.logOutLabel}>Log Out</Text>
          </Pressable>
        </View>
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
  logOutSection: {
    marginTop: 4,
  },
  title: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  logOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  logOutLabel: {
    color: AppColors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
