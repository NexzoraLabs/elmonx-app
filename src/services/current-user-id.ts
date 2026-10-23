import { API_BASE_URL } from '@/config/env';
import { getJson } from '@/services/http';

// The stored login payload isn't guaranteed to carry `_id`, so resolve it once per token.
const cache = new Map<string, Promise<string | null>>();

export function fetchUserId(token: string): Promise<string | null> {
  let pending = cache.get(token);
  if (!pending) {
    pending = getJson<{ data?: { _id?: string } }>(`${API_BASE_URL}/user/profile`, token)
      .then((body) => {
        const id = body.data?._id ?? null;
        // Don't remember a failed lookup (expired session, server hiccup) for this token.
        if (!id) cache.delete(token);
        return id;
      })
      .catch(() => {
        cache.delete(token);
        return null;
      });
    cache.set(token, pending);
  }
  return pending;
}

/** On sign-out: the next account must never see the previous one's id. */
export function clearUserIdCache(): void {
  cache.clear();
}
