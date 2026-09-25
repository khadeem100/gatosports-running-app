import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { AppIcon } from '@/components/app-icon';
import { Button, Card, Eyebrow, Page, SectionTitle } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { demoChallenges } from '@/data/demo';
import { api } from '@/lib/api';
import { secureSession } from '@/lib/auth-storage';
import { formatDistance } from '@/lib/format';
import { listRuns } from '@/storage/run-store';
import type { Run } from '@/types/domain';

const JOINED_KEY = 'gato-running-joined-challenges';

function deadlineLabel(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value;
  const days = Math.ceil((time - Date.now()) / 86_400_000);
  return days < 1 ? 'Loopt af vandaag' : days === 1 ? 'Nog 1 dag' : `Nog ${days} dagen`;
}

export default function ChallengesScreen() {
  const colors = useAppTheme();
  const [joined, setJoined] = useState<string[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([SecureStore.getItemAsync(JOINED_KEY), listRuns()]).then(([saved, savedRuns]) => {
      if (!active) return;
      if (saved) setJoined(JSON.parse(saved) as string[]);
      setRuns(savedRuns);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []));
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekMeters = runs.filter((run) => new Date(run.startedAt).getTime() >= weekStart.getTime()).reduce((sum, run) => sum + run.distanceM, 0);
  const weeklyGoalMeters = 15_000;
  const weeklyProgress = Math.min(100, Math.round(weekMeters / weeklyGoalMeters * 100));
  const challengesQuery = useQuery({ queryKey: ['challenges'], queryFn: api.challenges });
  const challenges = challengesQuery.data ?? demoChallenges;
  const join = async (id: string) => {
    if (joined.includes(id)) return;
    if (await secureSession.getToken()) {
      try { await api.joinChallenge(id); } catch { Alert.alert('Even niet gelukt', 'Je kunt deze uitdaging later opnieuw proberen.'); return; }
    }
    const next = [...new Set([...joined, id])];
    setJoined(next);
    await SecureStore.setItemAsync(JOINED_KEY, JSON.stringify(next));
  };
  return <Page>
    <View style={{ gap: 6 }}><Eyebrow>LOOP OP JOUW MANIER</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 }}>Samen kom je verder.</Text><Text style={{ color: colors.secondary, fontSize: 14, lineHeight: 20 }}>Kleine doelen maken van elke run een stap vooruit.</Text></View>
    <Card style={{ backgroundColor: colors.ink, borderWidth: 0, padding: 19, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow color={colors.lime}>DEZE WEEK</Eyebrow><View style={{ padding: 8, borderRadius: 12, backgroundColor: 'rgba(199,243,107,.13)' }}><AppIcon name="trophy" color={colors.lime} size={19} /></View></View>
      <Text style={{ color: '#F4F7F1', fontSize: 22, fontWeight: '800', maxWidth: 250 }}>Jouw weekdoel: 15 kilometer.</Text>
      <View style={{ height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><View style={{ width: `${weeklyProgress}%`, height: '100%', backgroundColor: colors.lime, borderRadius: 8 }} /></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: '#D3E0D0', fontSize: 12 }}>{formatDistance(weekMeters)} km gelopen</Text><Text style={{ color: colors.lime, fontSize: 12, fontWeight: '800' }}>{weeklyProgress}%</Text></View>
    </Card>
    <SectionTitle title="Uitdagingen voor jou" />
    {challenges.map((challenge, index) => {
      const isJoined = joined.includes(challenge.id);
      return <Card key={challenge.id} style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: challenge.accent, alignItems: 'center', justifyContent: 'center' }}><AppIcon name={index === 2 ? 'moon' : 'spark'} size={23} color="#19331F" /></View>
          <View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.ink, fontSize: 17, fontWeight: '800' }}>{challenge.name}</Text><Text style={{ color: colors.secondary, fontSize: 13, lineHeight: 19 }}>{challenge.description}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Details uitdaging" hitSlop={8}><AppIcon name="chevron" color={colors.secondary} /></Pressable>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><AppIcon name="target" size={15} color={colors.green} /><Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>{challenge.goalKm} km · {deadlineLabel(challenge.endsAt)}</Text></View>
          <Button label={isJoined ? 'Je doet mee ✓' : 'Doe mee'} kind={isJoined ? 'secondary' : 'primary'} onPress={() => void join(challenge.id)} style={{ minHeight: 40, paddingHorizontal: 16 }} />
        </View>
      </Card>;
    })}
    {challengesQuery.data?.some((item) => item.id.startsWith('demo-')) ? <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center' }}>Voorbeelduitdagingen · jouw voortgang blijft op dit toestel.</Text> : null}
  </Page>;
}
