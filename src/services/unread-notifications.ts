import { getUnreadCount } from '@/services/notifications-api';

/**
 * One unread-notifications count for the whole app. Every HomeHeader (Home, Feed, Collections,
 * Profile, Chat, Account) used to fetch its own copy once and never update it; now they share this
 * store, which refetches when the app comes back to the foreground and drops to 0 once the
 * Notifications screen has loaded them (the backend marks them seen on fetch).
 */

const STALE_MS = 30_000;

let count = 0;
let fetchedAt = 0;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setCount(next: number) {
  if (next === count) return;
  count = next;
  listeners.forEach((listener) => listener());
}

export function getUnreadNotificationsCount(): number {
  return count;
}

export function subscribeUnreadNotifications(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function refreshUnreadNotifications(token: string, force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && Date.now() - fetchedAt < STALE_MS) return Promise.resolve();
  inFlight = getUnreadCount(token)
    .then((value) => {
      fetchedAt = Date.now();
      setCount(value);
    })
    .catch(() => {})
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** The Notifications screen loaded the list, which marks everything seen on the server. */
export function markNotificationsSeen(): void {
  fetchedAt = Date.now();
  setCount(0);
}

/** A `notification:new` socket push (website behaviour: the bell counts up live). */
export function bumpUnreadNotifications(): void {
  setCount(count + 1);
}

/** Sign-out / account switch. */
export function resetUnreadNotifications(): void {
  fetchedAt = 0;
  setCount(0);
}
