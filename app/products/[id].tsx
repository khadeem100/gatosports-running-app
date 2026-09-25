import { Linking, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import { Button, Card, Eyebrow, Page } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { demoProducts, demoWeather } from '@/data/demo';
import { api } from '@/lib/api';
import { formatEuro } from '@/lib/format';
import { recommendGear } from '@/lib/recommendations';

export default function ProductDetailScreen() {
  const colors = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productQuery = useQuery({ queryKey: ['products'], queryFn: api.products });
  const weatherQuery = useQuery({ queryKey: ['weather'], queryFn: () => api.weather() });
  const product = (productQuery.data ?? demoProducts).find((item) => item.id === id);
  const weather = weatherQuery.data ?? demoWeather;
  const recommendation = product ? recommendGear([product], weather, { distanceKm: 12, sunsetSoon: !weather.isDay })[0] : undefined;
  if (!product) return <Page><Text style={{ color: colors.secondary }}>Product niet gevonden.</Text></Page>;
  const shopUrlIsConfigured = /^https:\/\//.test(product.productUrl);
  return <Page>
    <View style={{ height: 235, borderRadius: 26, backgroundColor: '#DDE9D7', alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 170, height: 170, borderRadius: 68, backgroundColor: 'rgba(255,255,255,.5)', position: 'absolute', transform: [{ rotate: '20deg' }] }} /><AppIcon name="shoe" size={86} color="#2A593B" strokeWidth={1.15} /><View style={{ position: 'absolute', bottom: 17, left: 17, backgroundColor: '#FFFFFF', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 }}><Text style={{ color: '#305A3E', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>{product.category.toUpperCase()}</Text></View></View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}><View style={{ flex: 1, gap: 5 }}><Eyebrow>GATOSPORTS</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 25, lineHeight: 30, fontWeight: '900', letterSpacing: -0.5 }}>{product.name}</Text></View><Text style={{ color: colors.green, fontSize: 18, fontWeight: '900' }}>{formatEuro(product.price)}</Text></View>
    <Text style={{ color: colors.secondary, fontSize: 14, lineHeight: 22 }}>{product.description}</Text>
    {recommendation ? <Card style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}><View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="spark" size={16} color={colors.limeInk} /></View><View style={{ flex: 1, gap: 3 }}><Eyebrow>WAAROM DIT HELPT</Eyebrow><Text style={{ color: colors.ink, fontSize: 13, lineHeight: 19, fontWeight: '700' }}>{recommendation.reason}. Je kunt ook zonder aankoop prima op pad.</Text></View></Card> : <Card style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}><AppIcon name="heart" color={colors.green} size={18} /><Text style={{ flex: 1, color: colors.secondary, fontSize: 12 }}>Bekijk dit product wanneer jij eraan toe bent. Er is geen aankoop nodig om de app te gebruiken.</Text></Card>}
    <View style={{ flex: 1 }} />
    <Button label={shopUrlIsConfigured ? 'Bekijk op GatoSports' : 'Webshopkoppeling wordt ingesteld'} disabled={!shopUrlIsConfigured} onPress={() => { if (shopUrlIsConfigured) void Linking.openURL(product.productUrl); }} icon={<AppIcon name="arrow" size={16} color={colors.limeInk} />} />
    <Text style={{ color: colors.muted, fontSize: 10, textAlign: 'center' }}>{shopUrlIsConfigured ? 'Prijs en voorraad controleer je op de webshop.' : 'Dit is een voorbeeldproduct. De actuele webshop wordt later aangesloten.'}</Text>
  </Page>;
}
