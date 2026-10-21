type AppEnv = {
  apiUrl: string;
  socketUrl: string;
};

const dev: AppEnv = {
  apiUrl: 'https://api-dev.elmonx.com/api',
  socketUrl: 'https://api-dev.elmonx.com',
};

const live: AppEnv = {
  apiUrl: 'https://api.elmonx.com/api',
  socketUrl: 'https://api.elmonx.com',
};

// ─── Switch here to change environment ────────────────────────────────────────
const ACTIVE_ENV: AppEnv = dev;
// ──────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = ACTIVE_ENV.apiUrl;
export const SOCKET_URL = ACTIVE_ENV.socketUrl;
export const IS_DEV = ACTIVE_ENV === dev;
