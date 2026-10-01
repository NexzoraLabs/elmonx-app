import * as SecureStore from 'expo-secure-store';

const DARK_MODE_KEY = 'elmonx_pref_dark_mode';

/** Defaults to dark, matching the website's `elmonx-theme` default. */
export async function getDarkModePreference(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(DARK_MODE_KEY);
  return value !== 'false';
}

export async function setDarkModePreference(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(DARK_MODE_KEY, String(enabled));
}
