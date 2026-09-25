import '../lib/location-task';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RunSessionProvider } from '@/hooks/run-session';
import { SafetySessionProvider } from '@/hooks/safety-session';
import { queryClient } from '@/lib/query-client';
import { useAppTheme } from '@/constants/theme';

function AppStack() {
  const colors = useAppTheme();
  return <Stack screenOptions={{
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.ink,
    headerTitleStyle: { fontWeight: '800' },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.bg },
    animation: 'slide_from_right',
  }}>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="welcome" options={{ headerShown: false }} />
    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="auth" options={{ title: 'Welkom terug', presentation: 'modal' }} />
    <Stack.Screen name="run/active" options={{ title: 'Jouw run', headerShown: false, gestureEnabled: false }} />
    <Stack.Screen name="run/complete" options={{ title: 'Run afgerond', headerShown: false, gestureEnabled: false }} />
    <Stack.Screen name="run/history" options={{ title: 'Mijn runs' }} />
    <Stack.Screen name="run/[id]" options={{ title: 'Run details' }} />
    <Stack.Screen name="routes/[id]" options={{ title: 'Route details' }} />
    <Stack.Screen name="products/index" options={{ title: 'Hardloopuitrusting' }} />
    <Stack.Screen name="products/[id]" options={{ title: 'Product' }} />
    <Stack.Screen name="safety/index" options={{ title: 'Veiligheid' }} />
    <Stack.Screen name="settings/index" options={{ title: 'Instellingen' }} />
  </Stack>;
}

export default function RootLayout() {
  const colors = useAppTheme();
  return <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>
      <RunSessionProvider>
        <SafetySessionProvider>
          <StatusBar style={colors.bg === '#101813' ? 'light' : 'dark'} />
          <AppStack />
        </SafetySessionProvider>
      </RunSessionProvider>
    </QueryClientProvider>
  </SafeAreaProvider>;
}
