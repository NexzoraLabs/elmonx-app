import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { makeStyles, useAppColors } from '@/context/theme-context';
import { COUNTRIES, type Country } from '@/data/countries';
import { findCountry, flagEmoji, PREFERRED_ISO2 } from '@/services/phone';
import { useTranslation } from 'react-i18next';

type PhoneNumberFieldProps = {
  /** Selected country (ISO alpha-2, e.g. "gb"). */
  iso2: string;
  onIso2Change: (iso2: string) => void;
  /** National number as typed (without the dial code), like the website's separate-dial-code input. */
  number: string;
  onNumberChange: (number: string) => void;
  placeholder?: string;
  /** 'underline' matches the auth screens' inputs, 'filled' the account forms. */
  variant?: 'underline' | 'filled';
  hasError?: boolean;
  editable?: boolean;
};

/** Website-style phone input: flag + dial code picker on the left, number on the right. */
export function PhoneNumberField({
  iso2,
  onIso2Change,
  number,
  onNumberChange,
  placeholder,
  variant = 'filled',
  hasError,
  editable = true,
}: PhoneNumberFieldProps) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const [pickerOpen, setPickerOpen] = useState(false);
  const country = findCountry(iso2);

  return (
    <>
      <View
        style={[
          variant === 'filled' ? styles.filled : styles.underline,
          hasError && (variant === 'filled' ? styles.filledError : styles.underlineError),
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={country ? t('Country code {{country}} +{{dialCode}}', { country: country.name, dialCode: country.dialCode }) : t('Country code')}
          disabled={!editable}
          hitSlop={6}
          onPress={() => setPickerOpen(true)}
          style={styles.countryButton}>
          <Text style={styles.flag}>{country ? flagEmoji(country.iso2) : '🌐'}</Text>
          <Text style={styles.dialCode}>{country ? `+${country.dialCode}` : '+'}</Text>
          <Ionicons name="chevron-down" size={14} color={AppColors.textSecondary} />
        </Pressable>
        <View style={styles.divider} />
        <TextInput
          value={number}
          onChangeText={(text) => onNumberChange(text.replace(/[^\d\s()-]/g, ''))}
          placeholder={placeholder ?? t('Phone number')}
          placeholderTextColor={AppColors.textPlaceholder}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          editable={editable}
          style={styles.input}
        />
      </View>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        {pickerOpen ? (
          <CountryList
            selected={iso2}
            onSelect={(next) => {
              onIso2Change(next);
              setPickerOpen(false);
            }}
          />
        ) : null}
      </BottomSheet>
    </>
  );
}

function CountryList({ selected, onSelect }: { selected: string; onSelect: (iso2: string) => void }) {
  const { t } = useTranslation();
  const AppColors = useAppColors();
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^\+/, '');
    if (term) {
      return COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(term) || c.dialCode.startsWith(term) || c.iso2 === term,
      );
    }
    const preferred = PREFERRED_ISO2.map((code) => COUNTRIES.find((c) => c.iso2 === code)).filter(
      (c): c is Country => Boolean(c),
    );
    return [...preferred, ...COUNTRIES.filter((c) => !PREFERRED_ISO2.includes(c.iso2))];
  }, [query]);

  return (
    <View style={{ height: height * 0.7 }}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={AppColors.textPlaceholder} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('Search country or code')}
          placeholderTextColor={AppColors.textPlaceholder}
          autoCorrect={false}
          style={styles.searchInput}
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.iso2}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={20}
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect(item.iso2)}
            style={({ pressed }) => [
              styles.countryRow,
              !query && index === PREFERRED_ISO2.length - 1 && styles.preferredDivider,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.rowFlag}>{flagEmoji(item.iso2)}</Text>
            <Text style={styles.rowName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.rowDial}>+{item.dialCode}</Text>
            {item.iso2 === selected ? <Ionicons name="checkmark" size={18} color={AppColors.link} /> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((AppColors) => ({
  filled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingLeft: 14,
    paddingRight: 16,
  },
  filledError: {
    borderColor: AppColors.danger,
  },
  underline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  underlineError: {
    borderBottomColor: AppColors.danger,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  flag: {
    fontSize: 18,
  },
  dialCode: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: AppColors.border,
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: AppColors.textPrimary,
    fontSize: 15,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: AppColors.background,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 15,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  preferredDivider: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    marginBottom: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  rowFlag: {
    fontSize: 20,
  },
  rowName: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 15,
  },
  rowDial: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
}));
