import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { RouteMapPreview } from '@/components/route-map-preview';
import { Card, Eyebrow, InlineIconText, Metric, Page } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { demoRoutes } from '@/data/demo';
import { formatDistance, formatDuration, formatPace, formatShortDate } from '@/lib/format';
import { getRun } from '@/storage/run-store';
import type { Run } from '@/types/domain';

export default function RunDetailScreen() {
  const colors = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [run, setRun] = useState<Run | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void getRun(id).then((value) => {
      if (live) setRun(value);
    }).catch(() => { if (live) setRun(null); });
    return () => { live = false; };
  }, [id]);
  if (!run) return <Page><Text style={{ color: colors.secondary }}>{run === undefined ? 'Run laden…' : 'Deze run staat niet meer op dit apparaat.'}</Text></Page>;
  const route = { ...demoRoutes[0], points: run.points };
  return <Page>
    <View style={{ gap: 5 }}><Eyebrow>{formatShortDate(run.startedAt)}</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 29, fontWeight: '900' }}>Een fijne run.</Text><InlineIconText icon="pin" text="Privé opgeslagen run" /></View>
    <Card style={{ padding: 0, overflow: 'hidden' }}>{run.points.length > 1 ? <RouteMapPreview route={route} height={245} /> : <View style={{ height: 90, alignItems: 'center', justifyContent: 'center' }}><InlineIconText icon="pin" text="Geen GPS-route opgeslagen" /></View>}<View style={{ padding: 15, flexDirection: 'row', justifyContent: 'space-between' }}><InlineIconText icon="map" text={`${run.points.length} routepunten`} /><InlineIconText icon="safe" text="Alleen voor jou" /></View></Card>
    <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Metric label="AFSTAND" value={formatDistance(run.distanceM)} unit="km" /><Metric label="TIJD" value={formatDuration(run.durationMs)} /><Metric label="TEMPO" value={formatPace(run.averagePaceSecPerKm)} unit="/ km" /></Card>
    <Card style={{ gap: 8 }}><Eyebrow>JOUW NOTITIE</Eyebrow><Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>{run.feeling ? `Ik voelde me ${run.feeling.toLowerCase()}.` : 'Nog geen notitie voor deze run.'}</Text>{run.note ? <Text style={{ color: colors.secondary, fontSize: 13, lineHeight: 20 }}>{run.note}</Text> : null}</Card>
  </Page>;
}
