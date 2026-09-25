import { Tabs } from 'expo-router';
import { View } from 'react-native';
import type { ComponentProps } from 'react';
import { AppIcon } from '@/components/app-icon';
import { useAppTheme } from '@/constants/theme';

function TabBarIcon({ name, focused }: { name: ComponentProps<typeof AppIcon>['name']; focused: boolean }) {
  const colors = useAppTheme();
  return <View style={{ width: name === 'run' ? 45 : 34, height: name === 'run' ? 45 : 34, borderRadius: name === 'run' ? 16 : 12, alignItems: 'center', justifyContent: 'center', backgroundColor: name === 'run' ? colors.lime : focused ? colors.surfaceMuted : 'transparent', marginTop: name === 'run' ? -16 : 0 }}>
    <AppIcon name={name} size={name === 'run' ? 23 : 20} color={name === 'run' ? colors.limeInk : focused ? colors.green : colors.muted} strokeWidth={focused ? 2.1 : 1.7} />
  </View>;
}

export default function TabLayout() {
  const colors = useAppTheme();
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.ink,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 5 },
    tabBarStyle: { height: 78, paddingTop: 9, backgroundColor: colors.surface, borderTopColor: colors.line, borderTopWidth: 1 },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />, tabBarAccessibilityLabel: 'Home' }} />
    <Tabs.Screen name="routes" options={{ title: 'Routes', tabBarIcon: ({ focused }) => <TabBarIcon name="routes" focused={focused} />, tabBarAccessibilityLabel: 'Routes ontdekken' }} />
    <Tabs.Screen name="run" options={{ title: 'Start', tabBarIcon: ({ focused }) => <TabBarIcon name="run" focused={focused} />, tabBarAccessibilityLabel: 'Start hardlopen' }} />
    <Tabs.Screen name="challenges" options={{ title: 'Uitdagingen', tabBarIcon: ({ focused }) => <TabBarIcon name="challenge" focused={focused} />, tabBarAccessibilityLabel: 'Uitdagingen' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profiel', tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused} />, tabBarAccessibilityLabel: 'Profiel' }} />
  </Tabs>;
}
