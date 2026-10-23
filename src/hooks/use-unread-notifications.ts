import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/auth-context';
import {
  getUnreadNotificationsCount,
  refreshUnreadNotifications,
  subscribeUnreadNotifications,
} from '@/services/unread-notifications';

/** Shared unread-notifications badge count (see services/unread-notifications.ts). */
export function useUnreadNotifications(): number {
  const { token } = useAuth();
  const value = useSyncExternalStore(subscribeUnreadNotifications, getUnreadNotificationsCount);

  useEffect(() => {
    if (!token) return;
    refreshUnreadNotifications(token);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshUnreadNotifications(token);
    });
    return () => subscription.remove();
  }, [token]);

  return token ? value : 0;
}
