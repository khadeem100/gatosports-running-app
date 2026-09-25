import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import { RouteMapPreview } from '@/components/route-map-preview';
import { Brand, Button, Card, Eyebrow, IconButton, InlineIconText, Metric, Page, SectionTitle } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { demoProfile, demoRoutes, demoWeather } from '@/data/demo';
import { api } from '@/lib/api';
import { formatDistance } from '@/lib/format';
import { recommendGear } from '@/lib/recommendations';
import { secureSession } from '@/lib/auth-storage';
import { listRuns, listUnsyncedRuns, markRunSynced } from '@/storage/run-store';
import type { Run, UserProfile } from '@/types/domain';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

export default function HomeScreen() {
  const colors = useAppTheme();
  const [profile, setProfile] = useState<UserProfile>(demoProfile);
  const [runs, setRuns] = useState<Run[]>([]);
  useFocusEffect(useCallback(() => {
    let active = true;
    void (async () => {
      const [savedProfile, savedRuns] = await Promise.all([secureSession.getProfile<Partial<UserProfile>>(), listRuns()]);
      if (!active) return;
      if (savedProfile) setProfile({ ...demoProfile, ...savedProfile });
      setRuns(savedRuns);
      if (await secureSession.getToken()) {
        for (const pendingRun of await listUnsyncedRuns()) {
          try {
            await api.uploadRun(pendingRun);
            await markRunSynced(pendingRun.id);
          } catch { break; }
        }
      }
    })().catch(() => undefined);
    return () => { active = false; };
  }, []));
  const runnerName = profile.name.split(' ')[0];
  const weatherQuery = useQuery({ queryKey: ['weather'], queryFn: () => api.weather() });
  const routesQuery = useQuery({ queryKey: ['routes'], queryFn: api.routes });
  const weather = weatherQuery.data ?? demoWeather;
  const routes = routesQuery.data ?? demoRoutes;
  const route = routes[0] ?? demoRoutes[0];
  const minutesToSunset = useMemo(() => {
    const [hours, minutes] = weather.sunset.split(':').map(Number);
    const sunset = new Date(); sunset.setHours(hours, minutes, 0, 0);
    return Math.round((sunset.getTime() - Date.now()) / 60_000);
  }, [weather.sunset]);
  const sunsetSoon = minutesToSunset > 0 && minutesToSunset < 120;
  const recommendation = recommendGear(
    [{ id: 'reflective', name: 'Reflective Run Vest', category: 'Zichtbaarheid', price: 34.95, currency: 'EUR', description: '', productUrl: '', reasonTags: [] }],
    weather,
    { distanceKm: route.distanceKm, sunsetSoon },
  )[0];
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const thisWeekRuns = runs.filter((run) => new Date(run.startedAt).getTime() >= weekStart.getTime());
  const thisWeekDistance = thisWeekRuns.reduce((sum, run) => sum + run.distanceM, 0);
  const weeklyTarget = Math.max(1, Number(profile.runsPerWeek.match(/\d+/)?.[0] ?? 2));
  const weeklyProgress = Math.min(100, Math.round(thisWeekRuns.length / weeklyTarget * 100));
  const dateLabel = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase();

  return <Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Brand />
      <IconButton name="safe" label="Veiligheid openen" onPress={() => router.push('/safety')} tint={colors.green} />
    </View>

    <View style={{ gap: 4 }}>
      <Eyebrow>{dateLabel}</Eyebrow>
      <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 31, lineHeight: 37, fontWeight: '900', letterSpacing: -0.8 }}>{getGreeting()}, {runnerName}.</Text>
      <Text style={{ color: colors.secondary, fontSize: 15 }}>Zullen we een rondje plannen?</Text>
    </View>

    <Card style={{ padding: 0, overflow: 'hidden', borderWidth: 0, backgroundColor: colors.ink, gap: 0 }}>
      <View style={{ padding: 19, paddingBottom: 16, gap: 13 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow color={colors.lime}>HARDLOOPWEER · AMSTERDAM</Eyebrow>
          {weather.source === 'demo' ? <View style={{ backgroundColor: 'rgba(255,255,255,.1)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99 }}><Text style={{ color: '#D1DCD1', fontSize: 9, fontWeight: '800', letterSpacing: 0.9 }}>VOORBEELD</Text></View> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 68, height: 68, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(199,243,107,.14)' }}><AppIcon name="sun" size={38} color={colors.lime} strokeWidth={1.45} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#F5F7F2', fontWeight: '900', fontSize: 40, letterSpacing: -1.3 }}>{Math.round(weather.temperatureC)}°</Text>
            <Text style={{ color: '#C0CDC0', fontSize: 13, fontWeight: '600' }}>{weather.precipitationMm > 0 ? 'Lichte regen' : 'Droog en rustig'}</Text>
          </View>
          <View style={{ gap: 9 }}>
            <InlineIconText icon="wind" text={`${Math.round(weather.windKmh)} km/u`} color="#D4DDD3" />
            <InlineIconText icon="rain" text={`${Math.round(weather.humidityPercent)}% vocht`} color="#D4DDD3" />
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,.14)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <AppIcon name={sunsetSoon ? 'moon' : 'clock'} size={16} color={sunsetSoon ? colors.lime : '#D4DDD3'} />
            <Text style={{ color: '#E0E8DD', fontSize: 12, fontWeight: '700' }}>{sunsetSoon ? `Zonsondergang over ${Math.max(1, minutesToSunset)} min` : `Zon gaat onder om ${weather.sunset}`}</Text>
          </View>
          <Text style={{ color: sunsetSoon ? colors.lime : '#AFC0AE', fontSize: 11, fontWeight: '800' }}>{sunsetSoon ? 'ZICHTBAARHEID' : 'FIJN LOOPWEER'}</Text>
        </View>
      </View>
    </Card>

    <View style={{ gap: 12 }}>
      <SectionTitle title="Een rondje voor vandaag" action="Alle routes" onAction={() => router.push('/(tabs)/routes')} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${route.name}, ${formatDistance(route.distanceKm * 1000)} kilometer. Bekijk route`} onPress={() => router.push({ pathname: '/routes/[id]', params: { id: route.id } })}>
          <RouteMapPreview route={route} height={145} />
        </Pressable>
        <View style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: colors.ink, fontSize: 19, fontWeight: '800' }}>{route.name}</Text>
              <InlineIconText icon="pin" text={route.area} />
            </View>
            <Text style={{ color: colors.green, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatDistance(route.distanceKm * 1000)} <Text style={{ fontSize: 11 }}>km</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <InlineIconText icon="clock" text={`${route.durationMin} min`} />
            <InlineIconText icon="map" text={route.type} />
            <InlineIconText icon="target" text={route.difficulty} />
          </View>
          <Button label="Start deze run" onPress={() => router.push('/(tabs)/run')} style={{ minHeight: 48 }} icon={<AppIcon name="play" size={16} color={colors.limeInk} />} />
        </View>
      </Card>
    </View>

    <View style={{ gap: 12 }}>
      <SectionTitle title="Jouw week" action="Bekijk runs" onAction={() => router.push('/run/history')} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Metric label="Deze week" value={String(thisWeekRuns.length)} unit="runs" />
        <View style={{ width: 1, height: 44, backgroundColor: colors.line }} />
        <Metric label="Afstand" value={formatDistance(thisWeekDistance)} unit="km" />
        <View style={{ width: 1, height: 44, backgroundColor: colors.line }} />
        <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.green, fontSize: 15, fontWeight: '900' }}>{weeklyProgress}%</Text>
        </View>
      </Card>
      <Text style={{ color: colors.secondary, fontSize: 11 }}>{thisWeekRuns.length} van je {weeklyTarget} geplande runs deze week</Text>
    </View>

    {recommendation ? <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="shoe" size={23} color={colors.green} /></View>
      <View style={{ flex: 1, gap: 4 }}><Eyebrow>PAST BIJ JOUW RUN</Eyebrow><Text style={{ color: colors.ink, fontWeight: '800' }}>{recommendation.reason}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Bekijk hardloopuitrusting" onPress={() => router.push('/products')}><AppIcon name="chevron" color={colors.green} /></Pressable>
    </Card> : <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <AppIcon name="spark" color={colors.green} />
      <Text style={{ color: colors.secondary, flex: 1, fontSize: 13, lineHeight: 18 }}>Je uitrusting is al goed op orde. Tijd om van je run te genieten.</Text>
    </Card>}
  </Page>;
}
