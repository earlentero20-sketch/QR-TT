import { Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}
