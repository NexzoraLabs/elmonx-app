import { mapSegments, parseLink } from '@/services/website-links';

/** Maps incoming links to app routes (rules in services/website-links.ts). */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string | null {
  try {
    const { segments, isWeb } = parseLink(path);
    // elmonxapp://auth?code=… is the website sign-in callback, consumed by
    // WebBrowser.openAuthSessionAsync (services/web-auth.ts) — never a screen. On Android it also
    // reaches the router; null tells expo-router to ignore it.
    if (!isWeb && segments[0] === 'auth') return null;
    const mapped = mapSegments(segments);
    if (mapped) return mapped;
    // Unknown website page: open the app home. Other custom-scheme links (e.g. wallet
    // callbacks) keep their default handling.
    return isWeb ? '/' : path;
  } catch {
    return '/';
  }
}
