import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthCheckbox } from '@/components/auth/auth-checkbox';
import { haptic } from '@/components/motion';
import { useAuth } from '@/context/auth-context';
import { makeStyles, useAppColors } from '@/context/theme-context';
import i18n from '@/i18n';
import { getUkVerification, saveUkVerification, type UkVerification } from '@/services/uk-verification-api';
import { isValidBirthDate } from '@/utils/auth-validation';

const EMPTY: UkVerification = {
  full_name: '',
  date_of_birth: '',
  city: '',
  postcode: '',
  address_line_1: '',
  address_line_2: '',
  has_tax_id: false,
  tax_id: '',
};

/**
 * Website account/uk-verification: UK residents fill this in once before they can buy (the X-Coin
 * checkout answers "UK user verification required" until then). Read-only once saved, like the web.
 */
export default function UkVerificationScreen() {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  const [form, setForm] = useState<UkVerification>(EMPTY);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getUkVerification(token)
      .then((saved) => {
        if (!active || !saved) return;
        setForm({
          ...EMPTY,
          ...saved,
          date_of_birth: saved.date_of_birth ? new Date(saved.date_of_birth).toISOString().slice(0, 10) : '',
        });
        setIsSaved(true);
      })
      .catch((e) => active && setMessage({ type: 'error', text: e instanceof Error ? e.message : i18n.t('Something went wrong.') }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  const update = (field: keyof UkVerification, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (message?.type === 'error') setMessage(null);
  };

  const handleSave = async () => {
    if (!token || submitting) return;
    if (!form.full_name.trim() || !form.date_of_birth.trim() || !form.city.trim() || !form.postcode.trim() || !form.address_line_1.trim()) {
      setMessage({ type: 'error', text: t('Please fill all required fields') });
      return;
    }
    if (!isValidBirthDate(form.date_of_birth)) {
      setMessage({ type: 'error', text: t('Enter a valid date of birth (YYYY-MM-DD).') });
      return;
    }
    if (form.has_tax_id && !form.tax_id?.trim()) {
      setMessage({ type: 'error', text: t('Please enter your Tax ID') });
      return;
    }
    if (!termsAccepted) {
      setMessage({ type: 'error', text: t('Please confirm that the information is accurate.') });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await saveUkVerification(token, form);
      haptic('success');
      setIsSaved(true);
      setMessage({ type: 'success', text: t('Verification info saved successfully') });
    } catch (e) {
      haptic('error');
      setMessage({ type: 'error', text: e instanceof Error ? e.message : t('Something went wrong.') });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: 'full_name' | 'date_of_birth' | 'city' | 'postcode' | 'address_line_1' | 'address_line_2' | 'tax_id',
    label: string,
    placeholder: string,
    options: { keyboardType?: 'number-pad' | 'default'; autoCapitalize?: 'characters' | 'words' | 'none' } = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={form[key] ?? ''}
        onChangeText={(value) => update(key, value)}
        editable={!isSaved && !submitting}
        placeholder={placeholder}
        placeholderTextColor={AppColors.textPlaceholder}
        autoCapitalize={options.autoCapitalize ?? 'words'}
        autoCorrect={false}
        keyboardType={options.keyboardType ?? 'default'}
        accessibilityLabel={label}
        style={[styles.input, isSaved && styles.inputLocked]}
      />
    </View>
  );

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
        <Text style={styles.headerTitle}>{t('UK Verification')}</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={AppColors.link} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>{t('Please provide your details for UK account verification.')}</Text>

            {isSaved ? (
              <View style={[styles.banner, styles.bannerSuccess]}>
                <Ionicons name="checkmark-circle" size={18} color={AppColors.success} />
                <Text style={styles.bannerText}>{t('Your UK verification details are saved.')}</Text>
              </View>
            ) : null}

            {field('full_name', t('Full Legal Name *'), t('Enter full name'))}
            {field('date_of_birth', t('Date of Birth *'), t('YYYY-MM-DD'), { autoCapitalize: 'none', keyboardType: 'number-pad' })}
            {field('city', t('City / Town *'), t('Enter city'))}
            {field('postcode', t('Postcode *'), t('Enter postcode'), { autoCapitalize: 'characters' })}
            {field('address_line_1', t('Residential Address *'), t('Enter address line 1'))}
            {field('address_line_2', t('Address Line 2 (Optional)'), t('Enter address line 2'))}

            <View style={styles.checkbox}>
              <AuthCheckbox
                checked={form.has_tax_id}
                onChange={(value) => !isSaved && update('has_tax_id', value)}
                label={t('National Insurance Number or UTR (if available)')}
              />
            </View>
            {form.has_tax_id
              ? field('tax_id', t('National Insurance Number or UTR'), t('Enter National Insurance Number or UTR'), { autoCapitalize: 'characters' })
              : null}

            {!isSaved ? (
              <View style={styles.checkbox}>
                <AuthCheckbox
                  checked={termsAccepted}
                  onChange={setTermsAccepted}
                  label={t('I confirm that the information provided is accurate and up to date.')}
                />
              </View>
            ) : null}

            {message ? (
              <View style={[styles.banner, message.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
                <Text style={styles.bannerText}>{message.text}</Text>
              </View>
            ) : null}
          </ScrollView>

          {!isSaved ? (
            <View style={styles.footer}>
              <AuthButton label={t('Save')} onPress={handleSave} loading={submitting} disabled={submitting} />
            </View>
          ) : null}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
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
    fontSize: 17,
    fontWeight: '700',
  },
  loader: {
    paddingVertical: 48,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  subtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: AppColors.textPrimary,
    fontSize: 14,
  },
  inputLocked: {
    opacity: 0.7,
  },
  checkbox: {
    marginBottom: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  bannerError: {
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  bannerText: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
}));
