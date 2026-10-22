import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import * as addressApi from '@/services/address-api';
import type { ShippingAddress } from '@/services/address-api';
import { useTranslation } from 'react-i18next';

const EMPTY_FORM: ShippingAddress = {
  address_one: '',
  address_two: '',
  town_city: '',
  county_state: '',
  postal_code: '',
  country: '',
  phone_number: '',
  country_code: '',
  iso_code: '',
  primary: false,
};

type Props = {
  visible: boolean;
  onClose: () => void;
  editing: ShippingAddress | null;
  onSaved: () => void;
};

export function AddressFormSheet({ visible, onClose, editing, onSaved }: Props) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { token } = useAuth();
  // The parent remounts this sheet (via `key`) on every open, so initial state is always fresh.
  const [form, setForm] = useState<ShippingAddress>(() => editing ?? EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof ShippingAddress, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const canSave =
    form.phone_number.trim().length > 0 &&
    form.address_one.trim().length > 0 &&
    form.town_city.trim().length > 0 &&
    form.county_state.trim().length > 0 &&
    form.postal_code.trim().length > 0 &&
    form.country.trim().length > 0;

  const handleSave = async () => {
    if (!token || !canSave || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await addressApi.saveShippingAddress(token, form);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Unable to save this address.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{editing ? t('Edit Shipping Address') : t('Add Shipping Address')}</Text>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Field label={t('Phone Number')}>
          <TextInput
            value={form.phone_number}
            onChangeText={(v) => update('phone_number', v)}
            placeholder="(555) 123-4567"
            placeholderTextColor={AppColors.textPlaceholder}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </Field>

        <Field label={t('Address Line 1')}>
          <TextInput
            value={form.address_one}
            onChangeText={(v) => update('address_one', v)}
            placeholder={t('Street Name, Number')}
            placeholderTextColor={AppColors.textPlaceholder}
            style={styles.input}
          />
        </Field>

        <Field label={t('Address Line 2 (Optional)')}>
          <TextInput
            value={form.address_two}
            onChangeText={(v) => update('address_two', v)}
            placeholder={t('Apt, Suite, Unit, etc.')}
            placeholderTextColor={AppColors.textPlaceholder}
            style={styles.input}
          />
        </Field>

        <View style={styles.row}>
          <Field label={t('Town/City')} style={styles.rowField}>
            <TextInput
              value={form.town_city}
              onChangeText={(v) => update('town_city', v)}
              placeholder={t('Enter City')}
              placeholderTextColor={AppColors.textPlaceholder}
              style={styles.input}
            />
          </Field>
          <Field label={t('Country/State')} style={styles.rowField}>
            <TextInput
              value={form.county_state}
              onChangeText={(v) => update('county_state', v)}
              placeholder={t('Enter State')}
              placeholderTextColor={AppColors.textPlaceholder}
              style={styles.input}
            />
          </Field>
        </View>

        <View style={styles.row}>
          <Field label={t('Postal Code')} style={styles.rowField}>
            <TextInput
              value={form.postal_code}
              onChangeText={(v) => update('postal_code', v)}
              placeholder={t('Enter Postal Code')}
              placeholderTextColor={AppColors.textPlaceholder}
              style={styles.input}
            />
          </Field>
          <Field label={t('Country')} style={styles.rowField}>
            <TextInput
              value={form.country}
              onChangeText={(v) => update('country', v)}
              placeholder={t('Enter Country')}
              placeholderTextColor={AppColors.textPlaceholder}
              style={styles.input}
            />
          </Field>
        </View>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setForm((prev) => ({ ...prev, primary: !prev.primary }))}>
          <View style={[styles.checkbox, form.primary && styles.checkboxChecked]}>
            {form.primary ? <Ionicons name="checkmark" size={14} color={AppColors.buttonPrimaryText} /> : null}
          </View>
          <Text style={styles.checkboxLabel}>{t('Set as primary address')}</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.buttonRow}>
        <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]} onPress={onClose}>
          <Text style={styles.cancelText}>{t('Cancel')}</Text>
        </Pressable>
        <View style={styles.saveButton}>
          <AuthButton label={editing ? t('Save') : t('Add')} onPress={handleSave} disabled={!canSave} loading={isSaving} />
        </View>
      </View>
    </BottomSheet>
  );
}

function Field({ label, children, style }: { label: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  title: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  scroll: {
    maxHeight: 440,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 4,
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
    backgroundColor: AppColors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: AppColors.textPrimary,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: AppColors.buttonPrimaryBg,
    borderColor: AppColors.buttonPrimaryBg,
  },
  checkboxLabel: {
    color: AppColors.textPrimary,
    fontSize: 13,
  },
  error: {
    color: AppColors.danger,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  cancelText: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
  },
}));
