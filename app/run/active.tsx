import { useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { RouteMapPreview } from '@/components/route-map-preview';
import { Button, Card, Eyebrow, IconButton } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { useRunSession } from '@/hooks/run-session';
import { formatDistance, formatDuration, formatPace } from '@/lib/format';
import { demoRoutes } from '@/data/demo';
import type { Route } from '@/types/domain';

export default function ActiveRunScreen() {
  const colors = useAppTheme();
  const { routeId } = useLocalSearchParams<{ routeId?: string }>();
  const { status, runId, elapsedMs, distanceM, points, locationMessage, backgroundEnabled, pauseRun, resumeRun, enableBackgroundTracking, endRun } = useRunSession();
  const [appState, setAppState] = useState(AppState.currentState);
  const selected = demoRoutes.find((route) => route.id === routeId) ?? demoRoutes[0];
  const route = useMemo<Route>(() => ({ ...selected, id: runId ?? selected.id, points: points.length > 1 ? points : selected.points }), [points, runId, selected]);
  const pace = distanceM > 0 ? elapsedMs / 1000 / (distanceM / 1000) : 0;
  const currentPace = useMemo(() => {
    if (points.length < 2) return pace;
    const a = points[points.length - 2]; const b = points[points.length - 1];
    const time = (b.timestamp - a.timestamp) / 1000;
    const approximateMeters = Math.max(0, distanceM - (distanceM * (points.length - 2) / Math.max(points.length - 1, 1)));
    return time > 0 && approximateMeters > 2 ? time / (approximateMeters / 1000) : pace;
  }, [distanceM, pace, points]);
  const finish = async () => {
    const result = await endRun();
    if (result) router.replace('/run/complete');
  };
  const confirmFinish = () => Alert.alert('Run afronden?', 'Je run wordt bewaard. Daarna kun je aangeven hoe het voelde.', [
    { text: 'Verder lopen', style: 'cancel' },
    { text: 'Run afronden', style: 'destructive', onPress: () => void finish() },
  ]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', setAppState);
    return () => listener.remove();
  }, []);

  return <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20, gap: 15 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <IconButton name="close" label="Run verlaten" onPress={() => Alert.alert('Run actief', 'Pauzeer of rond je run af voordat je deze sluit.')} />
      <View style={{ alignItems: 'center', gap: 3 }}><Eyebrow>HARDLOPEN</Eyebrow><Text style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>{selected.name}</Text></View>
      <IconButton name="safe" label="Veiligheidsinstellingen" onPress={() => router.push('/safety')} tint={colors.green} />
    </View>
    <Card style={{ padding: 0, overflow: 'hidden', flex: 1, minHeight: 180 }}>
      <RouteMapPreview route={route} height={250} dark={colors.bg === '#101813'} />
      <View style={{ paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: status === 'running' ? colors.green : colors.orange }} />
        <Text style={{ color: colors.secondary, fontSize: 11, flex: 1 }}>{locationMessage}</Text>
        <Text style={{ color: colors.muted, fontSize: 10 }}>{points.length} gps-punten</Text>
      </View>
    </Card>
    <View style={{ alignItems: 'center', paddingVertical: 3 }}>
      <Text style={{ color: colors.ink, fontSize: 62, lineHeight: 70, fontWeight: '900', letterSpacing: -2, fontVariant: ['tabular-nums'] }}>{formatDistance(distanceM)}</Text>
      <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: -2 }}>KILOMETER</Text>
    </View>
    <Card style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }}>
      <View style={{ gap: 6, alignItems: 'center', flex: 1 }}><Eyebrow>TIJD</Eyebrow><Text style={{ color: colors.ink, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{formatDuration(elapsedMs)}</Text></View>
      <View style={{ width: 1, backgroundColor: colors.line }} />
      <View style={{ gap: 6, alignItems: 'center', flex: 1 }}><Eyebrow>TEMPO</Eyebrow><Text style={{ color: colors.ink, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{formatPace(currentPace)}</Text><Text style={{ color: colors.secondary, fontSize: 10 }}>/ km gemiddeld {formatPace(pace)}</Text></View>
    </Card>
    {status === 'paused' ? <Card style={{ flexDirection: 'row', gap: 9, alignItems: 'center', paddingVertical: 11 }}><AppIcon name="pause" size={16} color={colors.orange} /><Text style={{ color: colors.secondary, fontSize: 12, fontWeight: '700' }}>Run gepauzeerd · tijd telt niet mee</Text></Card> : null}
    {appState !== 'active' && !backgroundEnabled ? <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }}><AppIcon name="pin" size={17} color={colors.orange} /><Text style={{ color: colors.secondary, flex: 1, fontSize: 11, lineHeight: 16 }}>Houd deze app open, of zet achtergrond-gps aan zodat je run blijft lopen wanneer je scherm vergrendelt.</Text></Card> : null}
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {status === 'running' ? <Button label="Pauzeer" kind="secondary" onPress={() => void pauseRun()} style={{ flex: 1 }} icon={<AppIcon name="pause" size={16} color={colors.ink} />} /> : <Button label="Hervat" onPress={() => void resumeRun()} style={{ flex: 1 }} icon={<AppIcon name="play" size={15} color={colors.limeInk} />} />}
      <Button label="Stop" kind="danger" onPress={confirmFinish} style={{ flex: 1 }} icon={<AppIcon name="stop" size={16} color="#FFFFFF" />} />
    </View>
    {status === 'running' && !backgroundEnabled ? <Pressable accessibilityRole="button" onPress={() => void enableBackgroundTracking()}><Text style={{ color: colors.green, fontSize: 12, fontWeight: '800', textAlign: 'center' }}>Achtergrond-gps toestaan</Text></Pressable> : null}
    <Pressable accessibilityRole="button" onPress={() => router.push('/safety')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 2 }}>
      <AppIcon name="safe" size={15} color={colors.secondary} /><Text style={{ color: colors.secondary, fontWeight: '700', fontSize: 12 }}>Veiligheid en check-in</Text>
    </Pressable>
  </View>;
}
