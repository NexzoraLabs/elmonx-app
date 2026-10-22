import { isValidPhoneNumber, validatePhoneNumberLength, type CountryCode } from 'libphonenumber-js';

import { COUNTRIES, type Country } from '@/data/countries';
import i18n from '@/i18n';

/** Shown first in the country list — same as the website's preferredCountries. */
export const PREFERRED_ISO2 = ['gb', 'us', 'pk', 'ae', 'in'];

export function findCountry(iso2: string | null | undefined): Country | undefined {
  const code = (iso2 ?? '').toLowerCase();
  return COUNTRIES.find((c) => c.iso2 === code);
}

/** Emoji flag from an ISO-3166 alpha-2 code ("gb" → 🇬🇧). */
export function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('');
}

/** "+44" — the `country_code` value the backend stores (website personal-info sends the same). */
export function dialCodeOf(iso2: string): string {
  const country = findCountry(iso2);
  return country ? `+${country.dialCode}` : '';
}

/**
 * Website rules (intl-tel-input utils = libphonenumber): '' when valid, else the same message the
 * website shows. An empty number is left to the form's own "required" check.
 */
export function phoneValidationError(number: string, iso2: string): string {
  const value = number.trim();
  if (!value) return '';
  const country = iso2.toUpperCase() as CountryCode;
  try {
    if (isValidPhoneNumber(value, country)) return '';
    switch (validatePhoneNumberLength(value, country)) {
      case 'INVALID_COUNTRY':
        return i18n.t('Invalid country code');
      case 'TOO_SHORT':
        return i18n.t('Phone number is too short');
      case 'TOO_LONG':
        return i18n.t('Phone number is too long');
      case 'INVALID_LENGTH':
        return i18n.t('Invalid phone number length');
      default:
        return i18n.t('Invalid phone number');
    }
  } catch {
    return i18n.t('Invalid phone number');
  }
}
