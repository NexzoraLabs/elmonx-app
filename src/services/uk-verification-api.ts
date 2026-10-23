import { API_BASE_URL } from '@/config/env';
import { apiFetch, ApiError, readJson } from '@/services/http';
import i18n from '@/i18n';

// UK compliance details (website account/uk-verification, backend user/uk_verification).
// These routes answer `{ success, message, data }`; "nothing saved yet" is HTTP 201 `success: false`.

export type UkVerification = {
  full_name: string;
  date_of_birth: string;
  city: string;
  postcode: string;
  address_line_1: string;
  address_line_2?: string;
  has_tax_id: boolean;
  tax_id?: string;
};

type Envelope<T> = { success?: boolean; message?: string; data?: T; is_uk?: boolean; verified?: boolean };

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Backend decides by the session's country: only GB users have to verify before buying. */
export async function getUkStatus(token: string): Promise<{ isUk: boolean; verified: boolean }> {
  const response = await apiFetch(`${API_BASE_URL}/user/check_user_uk_status`, { headers: authHeaders(token) });
  const body = await readJson<Envelope<never>>(response);
  if (!body.success) return { isUk: false, verified: true };
  return { isUk: body.is_uk === true, verified: body.verified !== false };
}

/** Saved details, or null when the user hasn't submitted the form yet. */
export async function getUkVerification(token: string): Promise<UkVerification | null> {
  const response = await apiFetch(`${API_BASE_URL}/user/uk_verification`, { headers: authHeaders(token) });
  const body = await readJson<Envelope<UkVerification>>(response);
  return body.success && body.data?.full_name ? body.data : null;
}

export async function saveUkVerification(token: string, details: UkVerification): Promise<void> {
  const payload: UkVerification = {
    full_name: details.full_name.trim(),
    date_of_birth: details.date_of_birth.trim(),
    city: details.city.trim(),
    postcode: details.postcode.trim(),
    address_line_1: details.address_line_1.trim(),
    address_line_2: details.address_line_2?.trim() ?? '',
    has_tax_id: details.has_tax_id,
    // The validator has additionalProperties: false, so only send tax_id when there is one.
    ...(details.has_tax_id ? { tax_id: details.tax_id?.trim() ?? '' } : {}),
  };
  const response = await apiFetch(`${API_BASE_URL}/user/uk_verification`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await readJson<Envelope<never> & { status?: number }>(response);
  if (!(body.success || body.status === 200)) throw new ApiError(body.message || i18n.t('Something went wrong.'));
}
