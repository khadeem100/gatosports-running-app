import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import { Button, Card, Eyebrow, Page, SectionTitle } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { demoProducts, demoWeather } from '@/data/demo';
import { api } from '@/lib/api';
import { formatEuro } from '@/lib/format';
import { recommendGear } from '@/lib/recommendations';

const colorsByIndex = ['#D8E5D2', '#E9D9C9', '#DBE4E9'];
const icons = ['shoe', 'wind', 'run'] as const;

export default function ProductListScreen() {
  const colors = useAppTheme();
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: api.products });
  const weatherQuery = useQuery({ queryKey: ['weather'], queryFn: () => api.weather() });
  const products = productsQuery.data ?? demoProducts;
  const shopConnected = products.some((product) => product.id.startsWith('prestashop-'));
  const weather = weatherQuery.data ?? demoWeather;
  const recommended = useMemo(() => recommendGear(products, weather, {
    distanceKm: 12,
    sunsetSoon: !weather.isDay,
    ownedCategories: [],
  }), [products, weather]);
  return <Page>
    <View style={{ gap: 5 }}><Eyebrow>GOED OP PAD</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.7 }}>Hardloopuitrusting</Text><Text style={{ color: colors.secondary, lineHeight: 20 }}>Praktische tips en gear die past bij jouw run.</Text></View>
    {recommended.length > 0 ? <Card style={{ backgroundColor: colors.ink, borderColor: colors.ink, padding: 17, gap: 13 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow color={colors.lime}>PAST BIJ JE PLAN</Eyebrow><AppIcon name="spark" size={20} color={colors.lime} /></View>
      <Text style={{ color: '#F2F6EF', fontSize: 17, fontWeight: '800', lineHeight: 24 }}>{recommended[0].reason}.</Text>
      <Text style={{ color: '#AFC0AE', fontSize: 12 }}>Je kunt ook zonder extra aankoop prima op pad.</Text>
      <Button label="Bekijk hydratatie" kind="primary" onPress={() => router.push({ pathname: '/products/[id]', params: { id: recommended[0].id } })} style={{ minHeight: 45 }} />
    </Card> : <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><AppIcon name="heart" color={colors.green} /><Text style={{ color: colors.secondary, flex: 1, fontSize: 13, lineHeight: 19 }}>Je uitrusting past al goed bij vandaag. Je hebt niets extra&apos;s nodig.</Text></Card>}
    <View style={{ gap: 11 }}><SectionTitle title="Klein beetje extra comfort" /><Text style={{ color: colors.secondary, fontSize: 12, lineHeight: 18 }}>We tonen alleen producten als ze iets toevoegen aan jouw route of omstandigheden.</Text></View>
    {products.map((product, index) => <Card key={product.id} style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${product.name} bekijken`} onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}>
        <View style={{ height: 152, backgroundColor: colorsByIndex[index % colorsByIndex.length], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <View style={{ width: 135, height: 135, borderRadius: 55, backgroundColor: 'rgba(255,255,255,.45)', transform: [{ rotate: '18deg' }], position: 'absolute', top: 22, right: 22 }} />
          <AppIcon name={icons[index % icons.length]} size={60} color="#27523A" strokeWidth={1.2} />
          <View style={{ position: 'absolute', bottom: 12, left: 13, borderRadius: 99, backgroundColor: '#FFFFFF', paddingHorizontal: 9, paddingVertical: 6 }}><Text style={{ color: '#315840', fontWeight: '800', fontSize: 9, letterSpacing: 0.7 }}>{product.category.toUpperCase()}</Text></View>
        </View>
      </Pressable>
      <View style={{ padding: 15, gap: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}><View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.ink, fontWeight: '800', fontSize: 16 }}>{product.name}</Text><Text style={{ color: colors.secondary, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>{product.description}</Text></View><Text style={{ color: colors.green, fontWeight: '900', fontSize: 15 }}>{formatEuro(product.price)}</Text></View>
        <Button label="Waarom past dit?" kind="secondary" onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })} style={{ minHeight: 43 }} icon={<AppIcon name="arrow" size={15} color={colors.ink} />} />
      </View>
    </Card>)}
    <Card style={{ gap: 7, padding: 13 }}><Eyebrow>{shopConnected ? 'GATOSPORTS CATALOGUS' : 'VOORBEELDCATALOGUS'}</Eyebrow><Text style={{ color: colors.secondary, fontSize: 11, lineHeight: 17 }}>{shopConnected ? 'Producten komen rechtstreeks uit de webshop. Controleer prijs en voorraad op GatoSports.' : 'Dit zijn ontwikkelproducten. De webshop wordt aangesloten zodra de PrestaShop API-toegang is ingesteld.'}</Text></Card>
  </Page>;
}
