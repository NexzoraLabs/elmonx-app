import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/app-colors';
import { useAuth } from '@/context/auth-context';
import * as accountApi from '@/services/account-api';
import { getDarkModePreference, setDarkModePreference } from '@/services/preferences';

type LinkedAccounts = { google?: boolean; apple?: boolean };

export default function SettingsScreen() {
  const { token, user, signOut } = useAuth();
  const [emailPreference, setEmailPreferenceState] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'error' | 'info' | 'success'; text: string } | null>(null);

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const linkedAccounts = (user?.linked_accounts ?? {}) as LinkedAccounts;
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    const [profile, emailPref, darkPref] = await Promise.allSettled([
      accountApi.getProfile(token),
      accountApi.getEmailPreference(token),
      getDarkModePreference(),
    ]);
    if (!mountedRef.current) return;
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
    setMessage({ type: 'info', text: 'Connecting a Google account will be available soon.' });
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    if (!token) return;
    setPwLoading(true);
    try {
      await accountApi.updatePassword(token, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password updated successfully.' });
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Incorrect old password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action permanently deletes your account and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await accountApi.deleteAccount(token);
              await signOut();
              router.replace('/(auth)/welcome');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
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
            <Pressable onPress={() => setMessage(null)}>
              <View style={[
                styles.banner,
                message.type === 'error' ? styles.bannerError :
                message.type === 'success' ? styles.bannerSuccess :
                styles.bannerInfo,
              ]}>
                <Text style={styles.bannerText}>{message.text}</Text>
              </View>
            </Pressable>
          ) : null}

          {/* ── Notifications ── */}
          <Text style={styles.sectionLabel}>Notifications</Text>
          <ToggleRow label="Email & Preferences" value={emailPreference} onChange={handleEmailPreference} />

          {/* ── Account Privacy ── */}
          <Text style={styles.sectionLabel}>Account Privacy</Text>
          <ToggleRow label="Private Profile" value={isPrivate} onChange={handlePrivacy} />

          {/* ── Display ── */}
          <Text style={styles.sectionLabel}>Display</Text>
          <ToggleRow label="Dark Mode" value={darkMode} onChange={handleDarkMode} />

          {/* ── Link Google ── */}
          <Text style={styles.sectionLabel}>Link Google Account</Text>
          <LinkRow
            icon={<Ionicons name="logo-google" size={18} color={AppColors.textPrimary} />}
            label="Connect Your Google Account"
            connected={Boolean(linkedAccounts.google)}
            onPress={handleConnectGoogle}
          />

          {/* ── Change Password ── */}
          <Text style={styles.sectionLabel}>Change Password</Text>
          <View style={styles.card}>
            {pwError ? (
              <View style={styles.pwError}>
                <Text style={styles.pwErrorText}>{pwError}</Text>
              </View>
            ) : null}
            <PasswordField
              label="Old Password"
              value={oldPassword}
              onChange={setOldPassword}
              show={showPassword}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showPassword}
            />
            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showPassword}
              hint={
                confirmPassword
                  ? newPassword === confirmPassword
                    ? { ok: true, text: '✓ Passwords match' }
                    : { ok: false, text: 'Passwords do not match' }
                  : null
              }
            />
            <View style={styles.pwFooter}>
              <Pressable
                style={styles.showPwRow}
                onPress={() => setShowPassword((v) => !v)}>
                <View style={[styles.checkbox, showPassword && styles.checkboxActive]}>
                  {showPassword ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                </View>
                <Text style={styles.showPwLabel}>Show Password</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, (!oldPassword || !newPassword || !confirmPassword || pwLoading) && styles.saveBtnDisabled]}
                disabled={!oldPassword || !newPassword || !confirmPassword || pwLoading}
                onPress={handleChangePassword}>
                {pwLoading ? (
                  <ActivityIndicator size="small" color={AppColors.background} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* ── Danger Zone ── */}
          <Text style={[styles.sectionLabel, styles.dangerLabel]}>Danger Zone</Text>
          <View style={[styles.card, styles.dangerCard]}>
            <Text style={styles.dangerTitle}>Delete Account</Text>
            <Text style={styles.dangerSubtitle}>Permanently delete your account and all associated data.</Text>
            <Pressable
              style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
              onPress={handleDeleteAccount}>
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            </Pressable>
          </View>
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

function PasswordField({
  label,
  value,
  onChange,
  show,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  hint?: { ok: boolean; text: string } | null;
}) {
  return (
    <View style={styles.pwField}>
      <Text style={styles.pwLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
        placeholder={label}
        placeholderTextColor={AppColors.textPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.pwInput}
      />
      {hint ? (
        <Text style={[styles.pwHint, hint.ok ? styles.pwHintOk : styles.pwHintBad]}>{hint.text}</Text>
      ) : null}
    </View>
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
    paddingBottom: 40,
  },
  banner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  bannerError: { backgroundColor: 'rgba(255,69,58,0.12)' },
  bannerSuccess: { backgroundColor: 'rgba(52,199,89,0.12)' },
  bannerInfo: { backgroundColor: 'rgba(61,139,255,0.12)' },
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
  dangerLabel: {
    color: AppColors.danger,
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

  /* Card */
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    gap: 12,
  },
  dangerCard: {
    borderColor: 'rgba(255,69,58,0.3)',
    gap: 8,
  },

  /* Change Password */
  pwField: {
    gap: 4,
  },
  pwLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  pwInput: {
    color: AppColors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  pwHint: {
    fontSize: 11,
    marginTop: 2,
  },
  pwHintOk: { color: AppColors.success },
  pwHintBad: { color: AppColors.danger },
  pwError: {
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderRadius: 10,
    padding: 10,
  },
  pwErrorText: {
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  pwFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  showPwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: AppColors.textPrimary,
    borderColor: AppColors.textPrimary,
  },
  showPwLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: AppColors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: AppColors.background,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Danger Zone */
  dangerTitle: {
    color: AppColors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  dangerSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  deleteBtn: {
    backgroundColor: AppColors.danger,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
