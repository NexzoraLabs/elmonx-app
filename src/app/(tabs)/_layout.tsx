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
        <Stack.Screen name="profile/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </ChatProvider>
  );
}
