import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { secureSession } from '@/lib/auth-storage';
import { useAppTheme } from '@/constants/theme';

export default function Index() {
  const colors = useAppTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    secureSession.getOnboardingComplete().then((completed) => {
      if (!active) return;
      router.replace(completed ? '/(tabs)' : '/welcome');
      setReady(true);
    }).catch(() => {
      if (!active) return;
      router.replace('/welcome');
      setReady(true);
    });
    return () => { active = false; };
  }, []);
  return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
    {ready ? null : <ActivityIndicator color={colors.green} size="large" />}
  </View>;
}
