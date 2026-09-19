import { Stack } from 'expo-router';

import { AppColors } from '@/constants/app-colors';

export default function AppShellLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: AppColors.background },
      }}>
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
