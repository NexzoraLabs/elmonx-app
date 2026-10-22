/**
 * Maps incoming links to app routes. Website URLs carry a title slug the app routes don't have:
 *   https://elmonx.com/drop/<slug>/<id>                      -> /drop/<id>
 *   https://elmonx.com/collection/<slug>/<id>                -> /collection/<id>
 *   https://elmonx.com/auction/<slug>/<id>                   -> /auction/<id>
 *   https://elmonx.com/blindbox-item/<slug>/<dropId>/<item>  -> /blindbox-item/<dropId>/<item>
 *   https://elmonx.com/profile/<username>                    -> /profile/<username>
 *   https://elmonx.com/auctions                              -> /auctions
 * The same paths also work as elmonxapp://drop/<slug>/<id>, and app-style elmonxapp://drop/<id>.
 */

function parseLink(raw: string): { segments: string[]; isWeb: boolean } {
  let rest = raw.trim();
  let isWeb = false;
  const match = rest.match(/^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)(.*)$/i);
  if (match) {
    const [, scheme, host, tail] = match;
    if (/^https?$/i.test(scheme)) {
      isWeb = true;
      rest = tail;
    } else {
      // Custom scheme: "elmonxapp://drop/123" parses "drop" as the host.
      rest = host ? `/${host}${tail}` : tail;
    }
  }
  const pathOnly = rest.split(/[?#]/)[0];
  const segments = pathOnly
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  return { segments, isWeb };
}

function mapSegments([first, ...rest]: string[]): string | null {
  const last = rest[rest.length - 1];
  switch (first) {
    case 'drop':
    case 'collection':
    case 'auction':
      return last ? `/${first}/${encodeURIComponent(last)}` : null;
    case 'blindbox-item':
      if (rest.length < 2) return null;
      return `/blindbox-item/${encodeURIComponent(rest[rest.length - 2])}/${encodeURIComponent(last)}`;
    case 'profile':
      return rest[0] ? `/profile/${encodeURIComponent(rest[0])}` : null;
    case 'auctions':
      return '/auctions';
    default:
      return null;
  }
}

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const { segments, isWeb } = parseLink(path);
    const mapped = mapSegments(segments);
    if (mapped) return mapped;
    // Unknown website page: open the app home. Other custom-scheme links (e.g. wallet
    // callbacks) keep their default handling.
    return isWeb ? '/' : path;
  } catch {
    return '/';
  }
}
