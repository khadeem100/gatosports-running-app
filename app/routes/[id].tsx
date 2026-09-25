import { useEffect, useState } from 'react';
import { Share, Text, View, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import { RouteMapPreview } from '@/components/route-map-preview';
import { Button, Card, Eyebrow, IconButton, InlineIconText, Metric, Page } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { demoRoutes } from '@/data/demo';
import { api } from '@/lib/api';
import { formatDistance } from '@/lib/format';
import * as SecureStore from 'expo-secure-store';

const SAVED_ROUTES_KEY = 'gato-running-saved-routes';

export default function RouteDetailScreen() {
  const colors = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routesQuery = useQuery({ queryKey: ['routes'], queryFn: api.routes });
  const route = (routesQuery.data ?? demoRoutes).find((item) => item.id === id);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    void SecureStore.getItemAsync(SAVED_ROUTES_KEY).then((value) => setSaved((value ? JSON.parse(value) as string[] : []).includes(String(id))));
  }, [id]);
  if (!route) return <Page><Text style={{ color: colors.secondary }}>Route niet gevonden. Ga terug en kies een andere route.</Text></Page>;

  const toggleSaved = async () => {
    const current = JSON.parse(await SecureStore.getItemAsync(SAVED_ROUTES_KEY) ?? '[]') as string[];
    const next = saved ? current.filter((item) => item !== id) : [...new Set([...current, String(id)])];
    await SecureStore.setItemAsync(SAVED_ROUTES_KEY, JSON.stringify(next));
    setSaved(!saved);
  };
  const shareRoute = async () => {
    try { await Share.share({ message: `${route.name} · ${route.distanceKm} km · ${route.area}` }); }
    catch { Alert.alert('Delen niet gelukt', 'Je kunt de route later nog eens proberen te delen.'); }
  };

  return <Page bottom={34}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow>{route.id.startsWith('demo-') ? 'VOORBEELDROUTE · ' : ''}{route.type.toUpperCase()} · {route.difficulty.toUpperCase()}</Eyebrow><View style={{ flexDirection: 'row', gap: 8 }}><IconButton name="share" label="Deel deze route" onPress={() => void shareRoute()} /><IconButton name={saved ? 'heart' : 'plus'} label={saved ? 'Verwijder opgeslagen route' : 'Bewaar route'} onPress={() => void toggleSaved()} tint={saved ? colors.red : colors.green} /></View></View>
    <View style={{ gap: 6 }}><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.7 }}>{route.name}</Text><InlineIconText icon="pin" text={route.area} /></View>
    <Card style={{ padding: 0, overflow: 'hidden' }}><RouteMapPreview route={route} height={250} /><View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}><InlineIconText icon="map" text={route.loop ? 'Rondje' : 'Heen en terug'} /><InlineIconText icon="pin" text="Routevoorbeeld" /></View></Card>
    <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Metric label="AFSTAND" value={formatDistance(route.distanceKm * 1000)} unit="km" /><Metric label="GESCHAT" value={`${route.durationMin}`} unit="min" /><Metric label="HOOGTE" value={`${route.elevationM}`} unit="m" /></Card>
    <Card style={{ gap: 9 }}><Eyebrow>OVER DE ROUTE</Eyebrow><Text style={{ color: colors.ink, fontSize: 14, lineHeight: 21 }}>{route.description}</Text><View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 3 }}><View style={{ backgroundColor: colors.surfaceMuted, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 }}><Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>{route.type}</Text></View><View style={{ backgroundColor: colors.surfaceMuted, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 }}><Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>{route.difficulty}</Text></View><View style={{ backgroundColor: colors.surfaceMuted, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 }}><Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>{route.loop ? 'Rondje' : 'Enkele route'}</Text></View></View></Card>
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 }}><View style={{ width: 36, height: 36, borderRadius: 13, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="safe" size={18} color={colors.green} /></View><Text style={{ flex: 1, color: colors.secondary, fontSize: 12, lineHeight: 18 }}>Laat iemand weten waar je loopt als je alleen op pad gaat. Exacte routes blijven privé.</Text></Card>
    <Button label="Start deze route" onPress={() => router.push({ pathname: '/run/active', params: { routeId: route.id } })} icon={<AppIcon name="play" size={16} color={colors.limeInk} />} />
  </Page>;
}
