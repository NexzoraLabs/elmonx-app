import i18n from '@/i18n';

/**
 * Shared plumbing for every API client:
 * - `apiFetch` = fetch with a timeout (RN's fetch has none, so a dead connection spun forever)
 *   and a readable error when the network is down.
 * - `readJson` = response.json() that survives non-JSON bodies. Cloudflare/nginx answer 502/504
 *   with an HTML page, which used to surface as "JSON Parse error: Unexpected character '<'".
 * - `assertSuccess` = the backend answers HTTP 200 even for logical failures, so the body's
 *   `success` / `status` decides (see CLAUDE.md).
 * Global fetch is still wrapped by the session guard (services/session-guard.ts).
 */

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiEnvelope<T> = {
  status?: number;
  success?: boolean;
  message?: string;
  data?: T;
};

const DEFAULT_TIMEOUT_MS = 20_000;
// Image uploads on a slow mobile connection need longer.
const UPLOAD_TIMEOUT_MS = 90_000;

export async function apiFetch(url: string, init: RequestInit = {}, timeoutMs?: number): Promise<Response> {
  const limit = timeoutMs ?? (init.body instanceof FormData ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), limit);
  // A caller's own signal (e.g. a screen cancelling on unmount) still aborts the request.
  init.signal?.addEventListener('abort', () => controller.abort());
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (init.signal?.aborted) throw e;
    if (controller.signal.aborted) {
      throw new ApiError(i18n.t('The request timed out. Check your connection and try again.'));
    }
    throw new ApiError(i18n.t('No internet connection. Check your connection and try again.'));
  } finally {
    clearTimeout(timer);
  }
}

export async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(i18n.t('The server is not responding right now. Please try again in a moment.'));
  }
}

/** `getJson` for public/optional-auth GETs: fetch + parse in one go. */
export async function getJson<T>(url: string, token?: string | null, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(url, {
    ...init,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });
  return readJson<T>(response);
}

/**
 * Throws the body's message when the backend reports a logical failure. Some route groups (posts,
 * feed, chat, profile) also use body `status: 201` for validation/business errors — pass
 * `rejectStatus201` for those.
 */
export function assertSuccess<T>(envelope: ApiEnvelope<T>, options: { rejectStatus201?: boolean } = {}): T {
  const status = envelope.status;
  const failed =
    envelope.success === false ||
    (typeof status === 'number' && (status >= 400 || (options.rejectStatus201 === true && status === 201)));
  if (failed) throw new ApiError(envelope.message || i18n.t('Something went wrong.'));
  return envelope.data as T;
}

/** Appends a page to a list, dropping rows already shown (offset paging repeats rows when the
 * data changes between pages, which also meant duplicate React keys). */
export function appendUnique<T>(prev: T[], next: T[], keyOf: (item: T) => string): T[] {
  const seen = new Set(prev.map(keyOf));
  const fresh = next.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return fresh.length === 0 ? prev : [...prev, ...fresh];
}

/** Same as appendUnique for a first page: removes duplicates inside one response. */
export function uniqueBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  return appendUnique([], items, keyOf);
}
