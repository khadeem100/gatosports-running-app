import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { RouteMapPreview } from '@/components/route-map-preview';
import { Card, Eyebrow, InlineIconText, Page, SectionTitle } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { demoRoutes } from '@/data/demo';
import { formatDistance, formatPace, formatShortDate } from '@/lib/format';
import { listRuns } from '@/storage/run-store';
import type { Run } from '@/types/domain';

export default function RunHistoryScreen() {
  const colors = useAppTheme();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loaded, setLoaded] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    void listRuns().then((items) => { if (active) setRuns(items); }).catch(() => undefined).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []));
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weeklyRuns = runs.filter((run) => new Date(run.startedAt).getTime() >= weekStart.getTime());
  const weeklyDistance = weeklyRuns.reduce((sum, run) => sum + run.distanceM, 0);
  return <Page>
    <View style={{ gap: 5 }}><Eyebrow>JOUW VOORUITGANG</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 }}>Mijn runs</Text><Text style={{ color: colors.secondary }}>Elke run telt. Kijk eens wat je al hebt gedaan.</Text></View>
    <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', gap: 3 }}><Text style={{ color: colors.green, fontSize: 21, fontWeight: '900' }}>{runs.length}</Text><Eyebrow>RUNS</Eyebrow></View><View style={{ width: 1, height: 39, backgroundColor: colors.line }} />
      <View style={{ alignItems: 'center', gap: 3 }}><Text style={{ color: colors.green, fontSize: 21, fontWeight: '900' }}>{formatDistance(runs.reduce((sum, run) => sum + run.distanceM, 0))}</Text><Eyebrow>TOTAAL KM</Eyebrow></View><View style={{ width: 1, height: 39, backgroundColor: colors.line }} />
      <View style={{ alignItems: 'center', gap: 3 }}><Text style={{ color: colors.green, fontSize: 21, fontWeight: '900' }}>{formatDistance(weeklyDistance)}</Text><Eyebrow>DEZE WEEK KM</Eyebrow></View>
    </Card>
    <SectionTitle title="Recente activiteiten" />
    {runs.map((run, index) => {
      const mapRoute = { ...demoRoutes[index % demoRoutes.length], points: run.points.length > 1 ? run.points : demoRoutes[index % demoRoutes.length].points };
      return <Pressable key={run.id} accessibilityRole="button" accessibilityLabel={`Run van ${formatShortDate(run.startedAt)}, ${formatDistance(run.distanceM)} kilometer`} onPress={() => router.push({ pathname: '/run/[id]', params: { id: run.id } })}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {run.points.length > 1 ? <RouteMapPreview route={mapRoute} height={112} /> : <View style={{ height: 74, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><InlineIconText icon="pin" text="Geen GPS-route opgeslagen" /></View>}
          <View style={{ padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ gap: 4 }}><Text style={{ color: colors.ink, fontWeight: '800', fontSize: 16 }}>{formatShortDate(run.startedAt)}</Text><InlineIconText icon="pin" text="Opgeslagen op dit apparaat" /></View>
              <Text style={{ color: colors.green, fontSize: 20, fontWeight: '900' }}>{formatDistance(run.distanceM)} <Text style={{ fontSize: 10 }}>km</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 18 }}><InlineIconText icon="clock" text={`${Math.round(run.durationMs / 60_000)} min`} /><InlineIconText icon="target" text={`${formatPace(run.averagePaceSecPerKm)} /km`} />{run.feeling ? <InlineIconText icon="heart" text={run.feeling} /> : null}</View>
          </View>
        </Card>
      </Pressable>;
    })}
    {!loaded ? <Text style={{ color: colors.secondary, textAlign: 'center' }}>Runs ophalen…</Text> : null}
    {runs.length === 0 ? <Card><Text style={{ color: colors.secondary, textAlign: 'center', lineHeight: 21 }}>{loaded ? 'Je eerste run begint hier. Neem de tijd en geniet van buiten zijn.' : 'Je runs worden opgehaald…'}</Text></Card> : null}
  </Page>;
}
