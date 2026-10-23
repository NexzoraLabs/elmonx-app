import { useSyncExternalStore } from 'react';

/**
 * One shared 1-second clock for countdown text. A component that shows a ticking time calls
 * `useNow()` so only it re-renders each second — screens used to keep their own interval and
 * re-render everything (Home's lists, the auctions grid) every second. The timer runs only while
 * something is subscribed.
 */
let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now);
}
