import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as authApi from '@/services/auth-api';
import type { AuthSession, RegisterPayload, UserData } from '@/services/auth-api';

const TOKEN_KEY = 'elmonx_auth_token';
const REFRESH_TOKEN_KEY = 'elmonx_auth_refresh_token';
const USER_KEY = 'elmonx_auth_user';

type AuthContextValue = {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  /** Returns the account's real email address, to use for the OTP verification step. */
  signIn: (emailOrUsername: string, password: string) => Promise<string>;
  confirmSignInOtp: (emailAddress: string, code: string) => Promise<void>;
  resendOtp: (emailAddress: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  requestPasswordReset: (emailAddress: string) => Promise<void>;
  confirmPasswordReset: (emailAddress: string, code: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Merges fresh profile fields into the stored user (e.g. after a profile update). */
  updateUser: (changes: Partial<UserData>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function persistSession(session: AuthSession) {
  await SecureStore.setItemAsync(TOKEN_KEY, session.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user_data));
  if (session.refresh_token) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refresh_token);
  }
}

async function clearPersistedSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as UserData);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (emailOrUsername: string, password: string) => {
    const result = await authApi.login(emailOrUsername, password);
    return result.email_address;
  }, []);

  const applySession = useCallback(async (session: AuthSession) => {
    await persistSession(session);
    setToken(session.token);
    setUser(session.user_data);
  }, []);

  const confirmSignInOtp = useCallback(
    async (emailAddress: string, code: string) => {
      const session = await authApi.verifyLoginOtp(emailAddress, code);
      await applySession(session);
    },
    [applySession]
  );

  const resendOtp = useCallback(async (emailAddress: string) => {
    await authApi.resendOtp(emailAddress);
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const result = await authApi.register(payload);
    await applySession({ user_data: result.user_data, token: result.token });
  }, [applySession]);

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      const session = await authApi.loginWithGoogle(idToken);
      await applySession(session);
    },
    [applySession]
  );

  const requestPasswordReset = useCallback(async (emailAddress: string) => {
    await authApi.forgotPassword(emailAddress);
  }, []);

  const confirmPasswordReset = useCallback(
    async (emailAddress: string, code: string, newPassword: string) => {
      await authApi.resetPassword(emailAddress, code, newPassword);
    },
    []
  );

  const signOut = useCallback(async () => {
    if (token) {
      authApi.logout(token).catch(() => {
        // Best-effort — the local session is cleared regardless of server response.
      });
    }
    await clearPersistedSession();
    setToken(null);
    setUser(null);
  }, [token]);

  const updateUser = useCallback(
    async (changes: Partial<UserData>) => {
      if (!user) return;
      const next = { ...user, ...changes };
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(next));
      setUser(next);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isSignedIn: token != null,
      signIn,
      confirmSignInOtp,
      resendOtp,
      signUp,
      signInWithGoogle,
      requestPasswordReset,
      confirmPasswordReset,
      signOut,
      updateUser,
    }),
    [
      user,
      token,
      isLoading,
      signIn,
      confirmSignInOtp,
      resendOtp,
      signUp,
      signInWithGoogle,
      requestPasswordReset,
      confirmPasswordReset,
      signOut,
      updateUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
