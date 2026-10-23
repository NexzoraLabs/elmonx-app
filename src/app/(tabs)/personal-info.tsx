import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { PhoneNumberField } from '@/components/forms/phone-number-field';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import * as accountApi from '@/services/account-api';
import type { ProfileUpdatePayload } from '@/services/account-api';
import { dialCodeOf, phoneValidationError } from '@/services/phone';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { isValidBirthDate } from '@/utils/auth-validation';

// The backend only accepts these two (`config.users.gender.single_arr`); anything else is a 422.
const GENDERS = ['Male', 'Female'];

const EMPTY_FORM: ProfileUpdatePayload = {
  user_name: '',
  first_name: '',
  last_name: '',
  email_address: '',
  phone_number: '',
  country_code: '',
  iso_code: '',
  dob: '',
  gender: '',
  bio: '',
};

export default function PersonalInfoScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token, updateUser } = useAuth();
  const [form, setForm] = useState<ProfileUpdatePayload>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const profile = await accountApi.getProfile(token);
      setForm({
        user_name: profile.user_name ?? '',
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        email_address: profile.email_address ?? '',
        phone_number: profile.phone_number ?? '',
        country_code: profile.country_code ?? '',
        // Website personal-info: country from the saved iso_code, else United Kingdom.
        iso_code: profile.iso_code || 'gb',
        dob: profile.dob ? profile.dob.slice(0, 10) : '',
        gender: GENDERS.includes(profile.gender ?? '') ? (profile.gender as string) : '',
        bio: profile.bio ?? '',
      });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : i18n.t('Unable to load your profile.') });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  const update = (key: keyof ProfileUpdatePayload, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const canSave =
    form.user_name.trim().length > 0 &&
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    form.email_address.trim().length > 0 &&
    !isSaving;

  const handleSave = async () => {
    if (!token || !canSave) return;
    if (form.dob && !isValidBirthDate(form.dob)) {
      setMessage({ type: 'error', text: t('Enter a valid date of birth (YYYY-MM-DD).') });
      return;
    }
    const phoneError = phoneValidationError(form.phone_number, form.iso_code);
    if (phoneError) {
      setMessage({ type: 'error', text: phoneError });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        user_name: form.user_name.trim(),
        email_address: form.email_address.trim(),
        phone_number: form.phone_number.trim(),
        // Always derived from the picked country ("+44"), like the website.
        country_code: dialCodeOf(form.iso_code),
      };
      await accountApi.updateProfile(token, payload);
      await updateUser({
        user_name: payload.user_name,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email_address: payload.email_address,
        phone_number: payload.phone_number,
      });
      setMessage({ type: 'success', text: t('Profile updated successfully.') });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : t('Unable to update your profile.') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={AppColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('Personal Information')}</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={AppColors.link} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}>
            {message ? (
              <View style={[styles.banner, message.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
                <Text style={styles.bannerText}>{message.text}</Text>
              </View>
            ) : null}

            <Field label={t('Username')}>
              <Input
                value={form.user_name}
                onChangeText={(v) => update('user_name', v)}
                placeholder={t('Enter username')}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            <View style={styles.row}>
              <Field label={t('First Name')} style={styles.rowField}>
                <Input value={form.first_name} onChangeText={(v) => update('first_name', v)} placeholder={t('First name')} />
              </Field>
              <Field label={t('Last Name')} style={styles.rowField}>
                <Input value={form.last_name} onChangeText={(v) => update('last_name', v)} placeholder={t('Last name')} />
              </Field>
            </View>

            <Field label={t('Email')}>
              <Input
                value={form.email_address}
                onChangeText={(v) => update('email_address', v)}
                placeholder={t('Enter email')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            <Field label={t('Phone Number')}>
              <PhoneNumberField
                iso2={form.iso_code}
                onIso2Change={(iso2) => update('iso_code', iso2)}
                number={form.phone_number}
                onNumberChange={(v) => update('phone_number', v)}
              />
            </Field>

            <Field label={t('Date of Birth')}>
              <Input
                value={form.dob}
                onChangeText={(v) => update('dob', v)}
                placeholder={t('YYYY-MM-DD')}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </Field>

            <Field label={t('Gender')}>
              <View style={styles.pillRow}>
                {GENDERS.map((gender) => {
                  const selected = form.gender === gender;
                  return (
                    <Pressable
                      key={gender}
                      onPress={() => update('gender', selected ? '' : gender)}
                      style={[styles.pill, selected && styles.pillSelected]}>
                      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{t(gender)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label={t('Bio')}>
              <Input
                value={form.bio}
                onChangeText={(v) => update('bio', v)}
                placeholder={t('Tell others about yourself')}
                multiline
                style={styles.bioInput}
              />
            </Field>
          </ScrollView>

          <View style={styles.footer}>
            <AuthButton label={t('Save')} onPress={handleSave} disabled={!canSave} loading={isSaving} />
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function Field({ label, children, style }: { label: string; children: ReactNode; style?: object }) {
  const styles = useStyles();
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Input({ style, ...props }: TextInputProps) {
  const AppColors = useAppColors();
  const styles = useStyles();
  return <TextInput placeholderTextColor={AppColors.textPlaceholder} style={[styles.input, style]} {...props} />;
}

const useStyles = makeStyles((AppColors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  flex: {
    flex: 1,
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
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  banner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  bannerError: {
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  bannerText: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  bioInput: {
    minHeight: 96,
    borderRadius: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.surface,
  },
  pillSelected: {
    backgroundColor: AppColors.buttonPrimaryBg,
  },
  pillText: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: AppColors.buttonPrimaryText,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
}));
