import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { Card, Button } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { useRunSession } from '@/hooks/run-session';
import { formatDistance, formatDuration, formatPace } from '@/lib/format';

const feelings = ['Zwaar', 'Lastig', 'Goed', 'Lekker', 'Geweldig'];

export default function RunCompleteScreen() {
  const colors = useAppTheme();
  const { completedRun, saveFeeling } = useRunSession();
  const [feeling, setFeeling] = useState('Goed');
  const [note, setNote] = useState('');
  const [discomfort, setDiscomfort] = useState('Geen');
  const done = async () => {
    if (completedRun) await saveFeeling(feeling, discomfort === 'Geen' ? note : `${note}${note ? '\n' : ''}Gevoel: ${discomfort}`);
    router.replace('/(tabs)');
  };
  if (!completedRun) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24, gap: 16 }}>
    <Text style={{ color: colors.ink, fontSize: 23, fontWeight: '900' }}>Run bewaard</Text><Text style={{ color: colors.secondary }}>Je run staat op dit apparaat.</Text><Button label="Naar home" onPress={() => router.replace('/(tabs)')} />
  </View>;
  return <View style={{ flex: 1, backgroundColor: colors.ink, padding: 20, paddingTop: 46, paddingBottom: 24, gap: 18 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}><View style={{ width: 46, height: 46, borderRadius: 17, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="check" color={colors.limeInk} size={24} strokeWidth={2.3} /></View><View><Text style={{ color: colors.lime, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>GOED GEDAAN</Text><Text accessibilityRole="header" style={{ color: '#FFFFFF', fontSize: 23, fontWeight: '900' }}>Je run zit erop.</Text></View></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {[['AFSTAND', `${formatDistance(completedRun.distanceM)} km`], ['TIJD', formatDuration(completedRun.durationMs)], ['GEM. TEMPO', `${formatPace(completedRun.averagePaceSecPerKm)}/km`]].map(([label, value]) => <Card key={label} style={{ width: '48%', backgroundColor: '#1C2B21', borderColor: '#344735', padding: 14, gap: 5 }}><Text style={{ color: '#AFC0AE', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{label}</Text><Text style={{ color: '#F5F7F2', fontSize: 21, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{value}</Text></Card>)}
    </View>
    <View style={{ gap: 10 }}><Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>Hoe voelde dit?</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{feelings.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === feeling }} onPress={() => setFeeling(item)} style={{ borderWidth: 1, borderColor: item === feeling ? colors.lime : '#344735', backgroundColor: item === feeling ? 'rgba(199,243,107,.15)' : '#1C2B21', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: item === feeling ? colors.lime : '#C1CEC0', fontWeight: '700', fontSize: 12 }}>{item}</Text></Pressable>)}</View></View>
    <View style={{ gap: 8 }}><Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>Ergens last van?</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{['Geen', 'Voeten', 'Knieën', 'Kuiten', 'Anders'].map((item) => <Pressable key={item} onPress={() => setDiscomfort(item)} style={{ backgroundColor: item === discomfort ? '#2A4630' : '#1C2B21', borderRadius: 99, paddingVertical: 8, paddingHorizontal: 11 }}><Text style={{ color: item === discomfort ? colors.lime : '#C1CEC0', fontSize: 11, fontWeight: '700' }}>{item}</Text></Pressable>)}</View><TextInput value={note} onChangeText={setNote} placeholder="Notitie voor jezelf (optioneel)" placeholderTextColor="#8D9C8E" multiline style={{ minHeight: 70, textAlignVertical: 'top', borderRadius: 14, backgroundColor: '#1C2B21', borderColor: '#344735', borderWidth: 1, color: '#FFFFFF', padding: 12, fontSize: 13 }} /></View>
    <View style={{ flex: 1 }} />
    <Button label="Bewaar run" onPress={() => void done()} />
    <Pressable accessibilityRole="button" onPress={() => Alert.alert('Jouw data', 'Je hardloopnotities zijn privé en worden niet gebruikt voor medische diagnoses.')}><Text style={{ color: '#ACBEAA', textAlign: 'center', fontSize: 11 }}>Je notities zijn persoonlijk en privé.</Text></Pressable>
  </View>;
}
