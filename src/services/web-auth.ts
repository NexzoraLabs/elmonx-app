import 'react-native-get-random-values';

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { sha256, stringToBytes } from 'viem';

import { WEB_URL } from '@/config/env';
import * as authApi from '@/services/auth-api';
import type { AuthSession } from '@/services/auth-api';
import i18n from '@/i18n';

/**
 * Google / Apple sign-in through the website (no native Google/Apple SDKs).
 *
 * 1. Open `<WEB_URL>/app-login` in the system auth sheet (ASWebAuthenticationSession / Chrome
 *    Custom Tab — never an embedded WebView: Google blocks OAuth there) with a PKCE challenge.
 * 2. The user signs in with any website method; the page redirects to `elmonxapp://auth?code&state`.
 * 3. The code + PKCE verifier are exchanged for the app's own session (`user/app-auth/exchange`).
 *
 * Tokens never travel in a URL, and a stolen code is useless without this attempt's verifier.
 */

// Must match the website's ALLOWED_REDIRECT_URIS (lmnx-st_ng app-login.ts).
export const WEB_AUTH_REDIRECT_URI = 'elmonxapp://auth';

const base64url = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const randomBase64url = (byteLength: number) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
};

/** Returns the session, or null when the user closed the sheet / tapped Cancel. */
export async function signInWithWebsite(): Promise<AuthSession | null> {
  const codeVerifier = randomBase64url(32); // 43 chars (RFC 7636 allows 43–128)
  const codeChallenge = base64url(sha256(stringToBytes(codeVerifier), 'bytes'));
  const state = randomBase64url(16);

  const query = new URLSearchParams({
    code_challenge: codeChallenge,
    state,
    redirect_uri: WEB_AUTH_REDIRECT_URI,
  });
  const result = await WebBrowser.openAuthSessionAsync(
    `${WEB_URL}/app-login?${query.toString()}`,
    WEB_AUTH_REDIRECT_URI,
  );
  if (result.type !== 'success') return null;

  const params = Linking.parse(result.url).queryParams ?? {};
  const value = (key: string) => {
    const raw = params[key];
    return typeof raw === 'string' ? raw : undefined;
  };
  if (value('error') === 'access_denied') return null;
  if (value('state') !== state) throw new Error(i18n.t('Sign-in could not be verified. Please try again.'));
  const code = value('code');
  if (!code) throw new Error(i18n.t('Sign-in did not complete. Please try again.'));

  return authApi.exchangeAppAuthCode(code, codeVerifier);
}
