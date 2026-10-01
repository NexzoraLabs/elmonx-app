import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function Index() {
  const { isLoading, isSignedIn } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Redirect href={isSignedIn ? '/home' : '/(auth)/welcome'} />;
}
