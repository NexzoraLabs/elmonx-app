type AppEnv = {
  apiUrl: string;
  socketUrl: string;
  /** Website (lmnx-st_ng) — hosts /app-login for Google/Apple sign-in. */
  webUrl: string;
};

const dev: AppEnv = {
  apiUrl: 'https://api-dev.elmonx.com/api',
  socketUrl: 'https://api-dev.elmonx.com',
  webUrl: 'https://ddrops.elmonx.com',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the other side of the ACTIVE_ENV switch below
const live: AppEnv = {
  apiUrl: 'https://api.elmonx.com/api',
  socketUrl: 'https://api.elmonx.com',
  webUrl: 'https://elmonx.com',
};

// ─── Switch here to change environment ────────────────────────────────────────
const ACTIVE_ENV: AppEnv = dev;
// ──────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = ACTIVE_ENV.apiUrl;
export const SOCKET_URL = ACTIVE_ENV.socketUrl;
export const WEB_URL = ACTIVE_ENV.webUrl;
export const IS_DEV = ACTIVE_ENV === dev;

/**
 * Public website for links people share or read (drop / post / profile share links, legal pages,
 * articles). Always the live site — dev links (ddrops) are behind basic auth.
 */
export const SHARE_URL = 'https://elmonx.com';

// Giphy — same key + channel as the website (`lmnx-st_ng` environment.ts). A Giphy API key is a
// public client key (it already ships in the web bundle). Channel set = trending shows only
// @elmonx's own GIFs; search still covers all of Giphy.
export const GIPHY_API_KEY = 'MQvE3dEUDWumomsSkimU0ycQF9sJwHox';
export const GIPHY_CHANNEL = 'elmonx';

// Sentry project DSN (Sentry → Project Settings → Client Keys). Empty = crash reporting off.
// A DSN is a public client key, safe to ship in the app.
export const SENTRY_DSN = '';
