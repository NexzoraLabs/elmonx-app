// Must load before anything that touches WalletConnect (crypto polyfills).
import '@walletconnect/react-native-compat';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAppKit, type Storage } from '@reown/appkit-react-native';
import { WagmiAdapter } from '@reown/appkit-wagmi-react-native';
import { QueryClient } from '@tanstack/react-query';
import { mainnet } from 'wagmi/chains';

// Same public project ID the website uses. com.elmonx.app.dev + the elmonxapp:// scheme
// must be allowlisted for it under Mobile Application IDs on dashboard.reown.com.
const PROJECT_ID = 'abbdaff37b3fab2c0dc3cd248cb47cf7';

const networks = [mainnet] as const;

function parse<T>(value: string | null): T | undefined {
  if (value == null) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

const storage: Storage = {
  getKeys: async () => [...(await AsyncStorage.getAllKeys())],
  getEntries: async <T>() => {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    return pairs.map(([key, value]) => [key, parse<T>(value) as T] as [string, T]);
  },
  getItem: async <T>(key: string) => parse<T>(await AsyncStorage.getItem(key)),
  setItem: async (key, value) => AsyncStorage.setItem(key, JSON.stringify(value)),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export const wagmiAdapter = new WagmiAdapter({ projectId: PROJECT_ID, networks });

export const queryClient = new QueryClient();

export const appKit = createAppKit({
  projectId: PROJECT_ID,
  networks: [...networks],
  defaultNetwork: mainnet,
  adapters: [wagmiAdapter],
  storage,
  themeMode: 'dark',
  metadata: {
    name: 'Elmonx',
    description: 'Elmonx',
    url: 'https://elmonx.com/',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
    redirect: { native: 'elmonxapp://' },
  },
});
