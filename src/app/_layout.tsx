// Loads the WalletConnect polyfills and creates the AppKit instance; keep this import first.
import { appKit, queryClient, wagmiAdapter } from '@/services/wallet/appkit';
// Initialises translations (saved / device language) before any screen renders.
import '@/i18n';

import { AppKit, AppKitProvider, useAppKitTheme } from '@reown/appkit-react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WagmiProvider } from 'wagmi';

import { AnimatedSplash } from '@/components/app/animated-splash';
import { AppErrorScreen } from '@/components/app/app-error-screen';
import { OfflineBanner } from '@/components/app/offline-banner';
import { UpdateBanner } from '@/components/app/update-banner';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import { initCrashReporting, wrapRootComponent } from '@/services/crash-reporting';
import { installSessionGuard } from '@/services/session-guard';

initCrashReporting();
installSessionGuard();
SplashScreen.preventAutoHideAsync();

export const ErrorBoundary = AppErrorScreen;

export default wrapRootComponent(RootLayout);

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedRoot />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function ThemedRoot() {
  const { isDark, colors } = useTheme();
  // Navigation chrome (screen backgrounds, headers, transitions) follows the app theme, not the phone's.
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.link,
        background: colors.background,
        card: colors.background,
        text: colors.textPrimary,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AppKitProvider instance={appKit}>
            <AppKitThemeSync />
            <AuthProvider>
              <NavigationThemeProvider value={navigationTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
                <OfflineBanner />
                <UpdateBanner />
                <AppSplash />
              </NavigationThemeProvider>
            </AuthProvider>
            {/* Expo Router needs the modal in an absolute overlay to render above the stack. */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <AppKit />
            </View>
          </AppKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}

/** Keeps the wallet-connect (Reown AppKit) modal in the app's theme. */
function AppKitThemeSync() {
  const { mode } = useTheme();
  const { setThemeMode } = useAppKitTheme();
  useEffect(() => {
    setThemeMode(mode);
  }, [mode, setThemeMode]);
  return null;
}

/** Animated splash on top of everything until the saved session has been restored. */
function AppSplash() {
  const { isLoading } = useAuth();
  return <AnimatedSplash ready={!isLoading} />;
}
