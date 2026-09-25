import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { Card, Eyebrow, Metric, Page } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { useRunSession } from '@/hooks/run-session';
import { formatDistance } from '@/lib/format';
import { RouteMapPreview } from '@/components/route-map-preview';
import { demoRoutes } from '@/data/demo';

export default function RunSetupScreen() {
  const colors = useAppTheme();
  const { startRun, locationMessage, status } = useRunSession();
  const [selectedGoal, setSelectedGoal] = useState('Vrije run');
  const begin = async () => {
    const started = await startRun();
    if (started) router.push('/run/active');
  };
  return <Page>
    <View style={{ gap: 5 }}><Eyebrow>JOUW MOMENT</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 }}>Klaar voor je run?</Text><Text style={{ color: colors.secondary, fontSize: 14 }}>Neem de tijd. Wij houden je voortgang bij.</Text></View>
    <Card style={{ padding: 0, overflow: 'hidden' }}><RouteMapPreview route={demoRoutes[0]} height={205} /><View style={{ padding: 17, gap: 11 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}><View style={{ gap: 4 }}><Eyebrow>VOORGESTELDE ROUTE</Eyebrow><Text style={{ color: colors.ink, fontSize: 19, fontWeight: '800' }}>{demoRoutes[0].name}</Text><Text style={{ color: colors.secondary }}>{demoRoutes[0].area}</Text></View><AppIcon name="map" color={colors.green} /></View>
      <View style={{ flexDirection: 'row', gap: 26 }}><Metric label="AFSTAND" value={formatDistance(demoRoutes[0].distanceKm * 1000)} unit="km" /><Metric label="RUSTIG TEMPO" value="5:50" unit="/km" /></View>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/routes/[id]', params: { id: demoRoutes[0].id } })}><Text style={{ color: colors.green, fontWeight: '800' }}>Bekijk route-informatie →</Text></Pressable>
    </View></Card>
    <View style={{ gap: 10 }}><Eyebrow>KIES JE RUN</Eyebrow><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Vrije run', '5 km', '30 minuten'].map((goal) => {
      const selected = selectedGoal === goal;
      return <Pressable key={goal} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setSelectedGoal(goal)} style={{ flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: selected ? colors.ink : colors.surface, borderColor: selected ? colors.ink : colors.line, borderWidth: 1, borderRadius: 99, paddingVertical: 11, paddingHorizontal: 14 }}>
        {selected ? <AppIcon name="check" size={14} color={colors.bg} /> : null}<Text style={{ color: selected ? colors.bg : colors.secondary, fontSize: 12, fontWeight: '700' }}>{goal}</Text>
      </Pressable>;
    })}</View></View>
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 }}>
      <View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="pin" size={18} color={colors.green} /></View>
      <View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.ink, fontWeight: '700', fontSize: 13 }}>GPS klaar voor vertrek</Text><Text style={{ color: colors.secondary, fontSize: 11 }}>{status === 'starting' ? 'Locatie wordt gecontroleerd…' : locationMessage}</Text></View>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: status === 'starting' ? colors.orange : colors.green }} />
    </Card>
    <Pressable accessibilityRole="button" accessibilityLabel="Start hardlopen" onPress={() => void begin()} style={({ pressed }) => ({ minHeight: 66, borderRadius: 24, backgroundColor: colors.lime, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: pressed ? 0.8 : 1, boxShadow: `0 8px 22px ${colors.shadow}` })}>
      <View style={{ width: 34, height: 34, borderRadius: 13, backgroundColor: colors.limeInk, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="play" size={16} color={colors.lime} /></View>
      <Text style={{ color: colors.limeInk, fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>{status === 'starting' ? 'GPS controleren…' : 'Start hardlopen'}</Text>
    </Pressable>
    <Text style={{ color: colors.secondary, fontSize: 11, lineHeight: 17, textAlign: 'center' }}>Je run wordt eerst veilig op dit toestel opgeslagen. Je kunt hem later synchroniseren.</Text>
  </Page>;
}
