import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as accountApi from '@/services/account-api';
import { getDarkModePreference, setDarkModePreference } from '@/services/preferences';

type LinkedAccounts = { google?: boolean; apple?: boolean };

export default function SettingsScreen() {
  const { token, user } = useAuth();
  const [emailPreference, setEmailPreferenceState] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  const linkedAccounts = (user?.linked_accounts ?? {}) as LinkedAccounts;

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    const [profile, emailPref, darkPref] = await Promise.allSettled([
      accountApi.getProfile(token),
      accountApi.getEmailPreference(token),
      getDarkModePreference(),
    ]);
    if (profile.status === 'fulfilled') setIsPrivate(profile.value.profile_privacy === 'Private');
    if (emailPref.status === 'fulfilled') setEmailPreferenceState(emailPref.value);
    if (darkPref.status === 'fulfilled') setDarkMode(darkPref.value);
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  const handleEmailPreference = async (value: boolean) => {
    if (!token) return;
    setEmailPreferenceState(value);
    setMessage(null);
    try {
      await accountApi.setEmailPreference(token, value);
    } catch (e) {
      setEmailPreferenceState(!value);
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to update email preference.' });
    }
  };

  const handlePrivacy = async (value: boolean) => {
    if (!token) return;
    setIsPrivate(value);
    setMessage(null);
    try {
      await accountApi.setProfilePrivacy(token, value ? 'Private' : 'Public');
    } catch (e) {
      setIsPrivate(!value);
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to update privacy.' });
    }
  };

  const handleDarkMode = async (value: boolean) => {
    setDarkMode(value);
    await setDarkModePreference(value);
  };

  const handleConnectGoogle = () => {
    if (linkedAccounts.google) return;
    // Linking needs the native Google Sign-In, which is waiting on the iOS OAuth client ID.
    setMessage({ type: 'info', text: 'Connecting a Google account will be available soon.' });
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={AppColors.link} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {message ? (
            <View style={[styles.banner, message.type === 'error' ? styles.bannerError : styles.bannerInfo]}>
              <Text style={styles.bannerText}>{message.text}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Notifications</Text>
          <ToggleRow label="Email & Preferences" value={emailPreference} onChange={handleEmailPreference} />

          <Text style={styles.sectionLabel}>Account Privacy</Text>
          <ToggleRow label="Private Profile" value={isPrivate} onChange={handlePrivacy} />

          <Text style={styles.sectionLabel}>Display</Text>
          <ToggleRow label="Dark Mode" value={darkMode} onChange={handleDarkMode} />

          <Text style={styles.sectionLabel}>Link Google Account</Text>
          <LinkRow
            icon={<Ionicons name="logo-google" size={18} color={AppColors.textPrimary} />}
            label="Connect Your Google Account"
            connected={Boolean(linkedAccounts.google)}
            onPress={handleConnectGoogle}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: AppColors.border, true: AppColors.success }}
        thumbColor={AppColors.textPrimary}
        ios_backgroundColor={AppColors.border}
      />
    </View>
  );
}

function LinkRow({
  icon,
  label,
  connected,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  connected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={connected}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.linkLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {connected ? (
        <Text style={styles.connected}>Connected</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
      )}
    </Pressable>
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
  loading: {
    paddingVertical: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  banner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  bannerError: {
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  bannerInfo: {
    backgroundColor: 'rgba(61,139,255,0.12)',
  },
  bannerText: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 24,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  rowLabel: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connected: {
    color: AppColors.success,
    fontSize: 12,
    fontWeight: '700',
  },
});
