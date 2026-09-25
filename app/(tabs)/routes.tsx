import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { AppIcon } from '@/components/app-icon';
import { RouteMapPreview } from '@/components/route-map-preview';
import { Button, Card, Eyebrow, IconButton, InlineIconText, Page, Pill, SectionTitle } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { demoRoutes } from '@/data/demo';
import { api } from '@/lib/api';
import { formatDistance } from '@/lib/format';
import type { Route } from '@/types/domain';

const distanceFilters = ['Alle', '0–5 km', '5–10 km', '10+ km'];
const types: (Route['type'] | 'Alle')[] = ['Alle', 'Park', 'Stad', 'Trail', 'Water'];

export default function RoutesScreen() {
  const colors = useAppTheme();
  const [distanceFilter, setDistanceFilter] = useState('Alle');
  const [typeFilter, setTypeFilter] = useState<Route['type'] | 'Alle'>('Alle');
  const [query, setQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState('Amsterdam en omgeving');
  const [locating, setLocating] = useState(false);
  const routesQuery = useQuery({ queryKey: ['routes'], queryFn: api.routes });
  const routes = routesQuery.data ?? demoRoutes;
  const filtered = useMemo(() => routes.filter((route) => {
    const words = `${route.name} ${route.area} ${route.type}`.toLowerCase();
    const matchesQuery = words.includes(query.trim().toLowerCase());
    const matchesType = typeFilter === 'Alle' || route.type === typeFilter;
    const matchesDistance = distanceFilter === 'Alle'
      || (distanceFilter === '0–5 km' && route.distanceKm <= 5)
      || (distanceFilter === '5–10 km' && route.distanceKm > 5 && route.distanceKm <= 10)
      || (distanceFilter === '10+ km' && route.distanceKm > 10);
    return matchesQuery && matchesType && matchesDistance;
  }), [distanceFilter, query, routes, typeFilter]);

  const requestLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationLabel('Locatie niet gedeeld');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocationLabel(`${current.coords.latitude.toFixed(2)}, ${current.coords.longitude.toFixed(2)}`);
    } catch {
      setLocationLabel('Locatie even niet beschikbaar');
    } finally { setLocating(false); }
  };

  return <Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ gap: 4 }}><Eyebrow>BUITEN BEGINT HIER</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 }}>Ontdek routes</Text></View>
      <IconButton name="map" label="Gebruik mijn locatie" onPress={() => void requestLocation()} tint={colors.green} />
    </View>
    <Card style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <AppIcon name="search" color={colors.secondary} size={19} />
      <TextInput value={query} onChangeText={setQuery} placeholder="Zoek plaats of route" placeholderTextColor={colors.muted} style={{ flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 5 }} returnKeyType="search" />
      <Pressable accessibilityRole="button" accessibilityLabel="Routes dichtbij" onPress={() => void requestLocation()} hitSlop={8}>
        <Text style={{ color: colors.green, fontWeight: '800', fontSize: 12 }}>{locating ? '...' : 'Dichtbij'}</Text>
      </Pressable>
    </Card>
    <View style={{ gap: 10 }}>
      <Eyebrow>AFSTAND</Eyebrow>
      <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>{distanceFilters.map((item) => <Pill key={item} label={item} selected={distanceFilter === item} onPress={() => setDistanceFilter(item)} />)}</View>
    </View>
    <View style={{ gap: 10 }}>
      <Eyebrow>OMGEVING</Eyebrow>
      <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>{types.map((item) => <Pill key={item} label={item} selected={typeFilter === item} onPress={() => setTypeFilter(item)} />)}</View>
    </View>
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
      <AppIcon name="pin" color={colors.green} size={17} />
      <View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.ink, fontWeight: '700', fontSize: 13 }}>{locationLabel}</Text><Text style={{ color: colors.secondary, fontSize: 11 }}>Locatie blijft alleen op je telefoon tot je een run start.</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Locatie vernieuwen" onPress={() => void requestLocation()}><AppIcon name="refresh" color={colors.green} size={17} /></Pressable>
    </Card>
    <SectionTitle title={`${filtered.length} routes die bij je passen`} />
    {routesQuery.isLoading ? <Card><Text style={{ color: colors.secondary }}>Routes laden…</Text></Card> : null}
    {filtered.map((route) => <Card key={route.id} style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${route.name} bekijken`} onPress={() => router.push({ pathname: '/routes/[id]', params: { id: route.id } })}>
        <RouteMapPreview route={route} height={142} />
      </Pressable>
      <View style={{ padding: 15, gap: 11 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.ink, fontSize: 18, fontWeight: '800' }}>{route.name}</Text><InlineIconText icon="pin" text={route.area} /></View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}><Text style={{ color: colors.green, fontWeight: '900', fontSize: 21 }}>{formatDistance(route.distanceKm * 1000)}</Text><Text style={{ color: colors.secondary, fontSize: 10 }}>KILOMETER</Text></View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><InlineIconText icon="clock" text={`${route.durationMin} min`} /><InlineIconText icon="map" text={route.type} /><InlineIconText icon="target" text={route.difficulty} /></View>
        <Button label="Bekijk route" kind="secondary" onPress={() => router.push({ pathname: '/routes/[id]', params: { id: route.id } })} style={{ minHeight: 46 }} icon={<AppIcon name="arrow" size={16} color={colors.ink} />} />
      </View>
    </Card>)}
    {filtered.length === 0 ? <Card><Text style={{ color: colors.secondary, textAlign: 'center' }}>Geen route gevonden. Pas je filters aan en kijk nog eens.</Text></Card> : null}
    {routesQuery.data?.some((route) => route.id.startsWith('demo-')) ? <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center' }}>Voorbeeldroutes · echte lokale routes komen beschikbaar via de route-integratie.</Text> : null}
  </Page>;
}
