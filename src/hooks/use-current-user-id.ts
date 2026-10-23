import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { fetchUserId } from '@/services/current-user-id';

// The id lookup + cache live in services/current-user-id.ts (auth-context clears it on sign-out
// without importing this hook, which would be a require cycle).
export { fetchUserId } from '@/services/current-user-id';

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
