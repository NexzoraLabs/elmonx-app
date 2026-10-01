const API_BASE_URL = 'https://api.elmonx.com/api';

export type UserData = {
  first_name: string;
  last_name: string;
  user_name: string;
  email_address: string;
  profile_avatar?: string;
  profile_avatar_url?: string;
  profile_status?: string;
  role?: string;
  game_points?: number;
  rank_points?: number;
  phone_number?: string;
  status?: string;
  email_verified?: boolean;
  mobile_login?: boolean;
  is_game_access?: boolean;
  linked_accounts?: unknown;
  has_manual_password?: boolean;
};

export type AuthSession = {
  wallet_address?: string;
  user_data: UserData;
  token: string;
  refresh_token?: string;
};

type ApiEnvelope<T> = {
  status: number;
  success?: boolean;
  message: string;
  data?: T;
};

class AuthApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthApiError';
  }
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as ApiEnvelope<T>;
  return json;
}

function assertSuccess<T>(envelope: ApiEnvelope<T>): T {
  // This backend often responds with HTTP 200/201 regardless of logical outcome —
  // the real success/failure signal is `success`/`status` in the JSON body itself.
  if (envelope.success === false || (envelope.status && envelope.status >= 400)) {
    throw new AuthApiError(envelope.message || 'Something went wrong.');
  }
  return envelope.data as T;
}

/**
 * Step 1 of login: accepts either an email address or a username, verifies the password,
 * and triggers an OTP email. No token yet. The response's `email_address` is the account's
 * real email — use it (not necessarily what the user typed) for the OTP verification step,
 * since that endpoint requires an actual email address.
 */
export async function login(
  emailOrUsername: string,
  password: string
): Promise<{ email_address: string; is_game_access?: boolean }> {
  const envelope = await postJson<{ email_address: string; is_game_access?: boolean }>('/user/auth', {
    email_address: emailOrUsername,
    password,
  });
  return assertSuccess(envelope);
}

/** Step 2 of login: verifies the OTP code and returns the real session (token/refresh_token). */
export async function verifyLoginOtp(emailAddress: string, verificationCode: string): Promise<AuthSession> {
  const envelope = await postJson<AuthSession>('/user/verification', {
    email_address: emailAddress,
    verification_code: verificationCode,
  });
  return assertSuccess(envelope);
}

export async function resendOtp(emailAddress: string): Promise<void> {
  const envelope = await postJson<void>('/user/resend_otp', { email_address: emailAddress });
  assertSuccess(envelope);
}

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  userName: string;
  emailAddress: string;
  password: string;
  phoneNumber: string;
};

/** Registration returns a usable session immediately — no OTP step required. */
export async function register(payload: RegisterPayload): Promise<{ user_data: UserData; token: string }> {
  const envelope = await postJson<{ user_data: UserData; token: string }>('/user/register', {
    first_name: payload.firstName,
    last_name: payload.lastName,
    user_name: payload.userName,
    email_address: payload.emailAddress,
    password: payload.password,
    phone_number: payload.phoneNumber,
  });
  return assertSuccess(envelope);
}

export async function forgotPassword(emailAddress: string): Promise<void> {
  const envelope = await postJson<Record<string, never>>('/user/forget_password', {
    email_address: emailAddress,
  });
  assertSuccess(envelope);
}

export async function resetPassword(
  emailAddress: string,
  resetCode: string,
  newPassword: string
): Promise<void> {
  const envelope = await postJson<void>('/user/reset_password', {
    email_address: emailAddress,
    reset_code: resetCode,
    new_password: newPassword,
  });
  assertSuccess(envelope);
}

export async function refreshSession(refreshToken: string): Promise<{ token: string; refresh_token: string }> {
  const envelope = await postJson<{ token: string; refresh_token: string }>('/user/refresh_token', {
    refresh_token: refreshToken,
  });
  return assertSuccess(envelope);
}

/** Google Sign-In: exchange a Google ID token for an ElmonX session (same response shape as OTP verify). */
export async function loginWithGoogle(idToken: string): Promise<AuthSession> {
  const envelope = await postJson<AuthSession>('/user/google-token', { id_token: idToken });
  return assertSuccess(envelope);
}

export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE_URL}/user/logout`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
