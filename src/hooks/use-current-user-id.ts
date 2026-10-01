import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';

const API_BASE_URL = 'https://api.elmonx.com/api';

// The stored login payload isn't guaranteed to carry `_id`, so resolve it once per token.
const cache = new Map<string, Promise<string | null>>();

function fetchUserId(token: string): Promise<string | null> {
  let pending = cache.get(token);
  if (!pending) {
    pending = fetch(`${API_BASE_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((body: { data?: { _id?: string } }) => body.data?._id ?? null)
      .catch(() => {
        cache.delete(token);
        return null;
      });
    cache.set(token, pending);
  }
  return pending;
}

export function useCurrentUserId(): string | null {
  const { token } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchUserId(token).then((id) => {
      if (active) setUserId(id);
    });
    return () => {
      active = false;
    };
  }, [token]);

  return token ? userId : null;
}
