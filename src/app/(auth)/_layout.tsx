import { Stack } from 'expo-router';

import { useAppColors } from '@/context/theme-context';

export default function AuthLayout() {
  const AppColors = useAppColors();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: AppColors.background },
        }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="create-account" />
        <Stack.Screen name="verify-code" />
        <Stack.Screen name="reset-password" />
      </Stack>
    </>
  );
}
