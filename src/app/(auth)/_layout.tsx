import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthColors } from '@/constants/auth-colors';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: AuthColors.background },
        }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="create-account" />
        <Stack.Screen name="verify-code" />
      </Stack>
    </>
  );
}
