import * as Sentry from '@sentry/react-native';
import type React from 'react';

import { IS_DEV, SENTRY_DSN } from '@/config/env';

// Debug builds report to the Metro console instead.
const enabled = Boolean(SENTRY_DSN) && !__DEV__;

/** Also installs Sentry's global handlers for fatal JS errors, unhandled promise rejections and native crashes. */
export function initCrashReporting() {
  if (!enabled) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_DEV ? 'dev-api' : 'production',
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!enabled) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function setCrashReportingUser(user: { id: string; username?: string } | null) {
  if (!enabled) return;
  Sentry.setUser(user ? { id: user.id, username: user.username } : null);
}

/** Sentry.wrap only when Sentry is running — wrapping without init logs an "App Start Span" warning. */
export function wrapRootComponent<P extends Record<string, unknown>>(component: React.ComponentType<P>): React.ComponentType<P> {
  return enabled ? Sentry.wrap(component) : component;
}
