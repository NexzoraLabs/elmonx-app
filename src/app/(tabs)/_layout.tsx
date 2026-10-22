import { Stack } from 'expo-router';

import { AppColors } from '@/constants/app-colors';
import { ChatProvider } from '@/context/chat-context';

export default function AppShellLayout() {
  return (
    <ChatProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AppColors.background },
        }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="artist/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="collection/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="drop/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="rewards" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="challenges" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="leaderboard" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="shipping-address" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="promo-code" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="personal-info" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="collectibles" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="doodles-physicals" options={{ animation: 'slide_from_right' }} />
        {/* Full screen, not a page sheet: KeyboardAvoidingView mis-measures inside an iOS page sheet
            (the toolbar ended up under the keyboard). */}
        <Stack.Screen name="create-post" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="user-search" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auctions" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auction/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="connections" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="blindbox-item/[dropId]/[itemId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="wallet" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </ChatProvider>
  );
}
