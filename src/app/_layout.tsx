// Loads the WalletConnect polyfills and creates the AppKit instance; keep this import first.
import { appKit, queryClient, wagmiAdapter } from '@/services/wallet/appkit';

import { AppKit, AppKitProvider } from '@reown/appkit-react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WagmiProvider } from 'wagmi';

import { AnimatedSplash } from '@/components/app/animated-splash';
import { AppErrorScreen } from '@/components/app/app-error-screen';
import { OfflineBanner } from '@/components/app/offline-banner';
import { UpdateBanner } from '@/components/app/update-banner';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { initCrashReporting, wrapRootComponent } from '@/services/crash-reporting';
import { installSessionGuard } from '@/services/session-guard';

initCrashReporting();
installSessionGuard();
SplashScreen.preventAutoHideAsync();

export const ErrorBoundary = AppErrorScreen;

export default wrapRootComponent(RootLayout);

function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AppKitProvider instance={appKit}>
            <AuthProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
                <OfflineBanner />
                <UpdateBanner />
                <AppSplash />
              </ThemeProvider>
            </AuthProvider>
            {/* Expo Router needs the modal in an absolute overlay to render above the stack. */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <AppKit />
            </View>
          </AppKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </GestureHandlerRootView>
  );
}

/** Animated splash on top of everything until the saved session has been restored. */
function AppSplash() {
  const { isLoading } = useAuth();
  return <AnimatedSplash ready={!isLoading} />;
}
