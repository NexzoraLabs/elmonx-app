const API_BASE_URL = 'https://api.elmonx.com/api';

type ApiEnvelope<T> = {
  status?: number;
  success?: boolean;
  message: string;
  data?: T;
};

class AccountApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountApiError';
  }
}

function assertSuccess<T>(envelope: ApiEnvelope<T>): T {
  // HTTP 200 is returned even for logical failures (e.g. duplicate username comes back as
  // body `{status: 400}`), so the body is the source of truth.
  if (envelope.success === false || (envelope.status && envelope.status >= 400)) {
    throw new AccountApiError(envelope.message || 'Something went wrong.');
  }
  return envelope.data as T;
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  return (await response.json()) as ApiEnvelope<T>;
}

export type ProfilePrivacy = 'Public' | 'Private';

export type AccountProfile = {
  user_name: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number?: string;
  country_code?: string;
  iso_code?: string;
  dob?: string;
  gender?: string;
  bio?: string;
  profile_privacy?: ProfilePrivacy;
  profile_avatar?: string;
  profile_avatar_url?: string;
};

export type ProfileUpdatePayload = {
  user_name: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  country_code: string;
  iso_code: string;
  dob: string;
  gender: string;
  bio: string;
};

export async function getProfile(token: string): Promise<AccountProfile> {
  return assertSuccess(await request<AccountProfile>('/user/profile', token));
}

export async function updateProfile(token: string, payload: ProfileUpdatePayload): Promise<AccountProfile> {
  const envelope = await request<AccountProfile>('/user/profile_update', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return assertSuccess(envelope);
}

export async function setProfilePrivacy(token: string, profilePrivacy: ProfilePrivacy): Promise<void> {
  const envelope = await request<unknown>('/profile/privacy', token, {
    method: 'PATCH',
    body: JSON.stringify({ profile_privacy: profilePrivacy }),
  });
  assertSuccess(envelope);
}

/** GET returns `email_preferences` (plural); POST takes `email_preference` (singular). */
export async function getEmailPreference(token: string): Promise<boolean> {
  const data = assertSuccess(await request<{ email_preferences?: boolean }>('/app-settings/email_preference', token));
  return data?.email_preferences ?? true;
}

export async function setEmailPreference(token: string, enabled: boolean): Promise<void> {
  const envelope = await request<unknown>('/app-settings/email_preference', token, {
    method: 'POST',
    body: JSON.stringify({ email_preference: enabled }),
  });
  assertSuccess(envelope);
}
