import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import * as authApi from '@/services/auth-api';
import type { AuthSession, RegisterPayload, UserData } from '@/services/auth-api';
import { setCrashReportingUser } from '@/services/crash-reporting';
import { configureSessionGuard } from '@/services/session-guard';
import { signInWithWebsite } from '@/services/web-auth';
import i18n from '@/i18n';

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
  /** Google/Apple (any website method) via the website's /app-login. False when the user cancelled. */
  signInWithWeb: () => Promise<boolean>;
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
  // Read by the fetch session guard outside React.
  const tokenRef = useRef<string | null>(null);
  const expiredHandledRef = useRef(false);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    setCrashReportingUser(user ? { id: user.user_name, username: user.user_name } : null);
  }, [user]);

  useEffect(() => {
    configureSessionGuard({
      getToken: () => tokenRef.current,
      refresh: async () => {
        try {
          const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
          if (!refreshToken) return null;
          const renewed = await authApi.refreshSession(refreshToken);
          await SecureStore.setItemAsync(TOKEN_KEY, renewed.token);
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, renewed.refresh_token);
          tokenRef.current = renewed.token;
          setToken(renewed.token);
          return renewed.token;
        } catch {
          return null;
        }
      },
      onExpired: () => {
        if (expiredHandledRef.current || !tokenRef.current) return;
        expiredHandledRef.current = true;
        tokenRef.current = null;
        clearPersistedSession().catch(() => {});
        setToken(null);
        setUser(null);
        router.replace('/(auth)/welcome');
        Alert.alert(i18n.t('Session expired'), i18n.t('Please log in again to continue.'));
      },
    });
  }, []);

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
    expiredHandledRef.current = false;
    tokenRef.current = session.token;
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

  const signInWithWeb = useCallback(async () => {
    const session = await signInWithWebsite();
    if (!session) return false;
    await applySession(session);
    return true;
  }, [applySession]);

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
    tokenRef.current = null;
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
      signInWithWeb,
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
      signInWithWeb,
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
