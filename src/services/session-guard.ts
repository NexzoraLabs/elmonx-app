import { API_BASE_URL } from '@/config/env';

/**
 * Wraps global fetch for ElmonX API calls:
 * - Expired sessions come back as HTTP 200 with body `status: 440` (backend AuthSession).
 *   The guard refreshes the token once (shared across parallel requests), retries the
 *   request with the new token, and only signs the user out if the refresh fails.
 * - Sends no cookies. The backend reads its auth cookie BEFORE the Bearer header, and
 *   React Native keeps cookies across logout/account switches, so a stale cookie could
 *   authenticate as the previous user. The app authenticates with Bearer only.
 */

type SessionHandlers = {
  getToken: () => string | null;
  /** Returns the new access token, or null when the session can't be renewed. */
  refresh: () => Promise<string | null>;
  onExpired: () => void;
};

const SESSION_EXPIRED_STATUS = 440;
const REFRESH_PATH = '/user/refresh_token';

let handlers: SessionHandlers | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let installed = false;

export function configureSessionGuard(next: SessionHandlers) {
  handlers = next;
}

function refreshOnce(): Promise<string | null> {
  if (!handlers) return Promise.resolve(null);
  refreshInFlight ??= handlers.refresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function isSessionExpired(response: Response): Promise<boolean> {
  if (!response.headers.get('content-type')?.includes('json')) return false;
  try {
    const text = await response.clone().text();
    if (!text.includes(String(SESSION_EXPIRED_STATUS))) return false;
    return (JSON.parse(text) as { status?: number }).status === SESSION_EXPIRED_STATUS;
  } catch {
    return false;
  }
}

function bearerOf(headers: Headers): string | null {
  const value = headers.get('Authorization');
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

export function installSessionGuard() {
  if (installed) return;
  installed = true;
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(API_BASE_URL) || typeof input !== 'string') {
      return originalFetch(input, init);
    }

    const apiInit: RequestInit = { ...init, credentials: 'omit' };
    const response = await originalFetch(input, apiInit);

    const headers = new Headers(init?.headers);
    const sentToken = bearerOf(headers);
    if (!sentToken || url.includes(REFRESH_PATH) || !handlers || !(await isSessionExpired(response))) {
      return response;
    }

    // Another request may already have renewed the token while this one was in flight.
    const current = handlers.getToken();
    const freshToken = current && current !== sentToken ? current : await refreshOnce();
    if (!freshToken) {
      handlers.onExpired();
      return response;
    }

    headers.set('Authorization', `Bearer ${freshToken}`);
    return originalFetch(input, { ...apiInit, headers });
  };
}
