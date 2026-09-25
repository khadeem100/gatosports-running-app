import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, Switch, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { Button, Card, Eyebrow, Page, SectionTitle } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { secureSession } from '@/lib/auth-storage';

const PREFS_KEY = 'gato-running-notification-preferences';
const defaultPreferences = { training: true, weather: true, races: false, safety: true, challenges: false };

export default function SettingsScreen() {
  const colors = useAppTheme();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [locationStatus, setLocationStatus] = useState('Controleren…');
  useEffect(() => {
    void Promise.all([SecureStore.getItemAsync(PREFS_KEY), Location.getForegroundPermissionsAsync()]).then(([raw, permission]) => {
      if (raw) setPreferences({ ...defaultPreferences, ...JSON.parse(raw) });
      setLocationStatus(permission.granted ? 'Toegestaan tijdens gebruik' : 'Nog niet toegestaan');
    }).catch(() => setLocationStatus('Niet beschikbaar'));
  }, []);
  const togglePreference = async (key: keyof typeof defaultPreferences, value: boolean) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
  };
  const signOut = async () => {
    await secureSession.clearToken();
    Alert.alert('Je bent uitgelogd', 'Jouw runs op dit apparaat blijven bewaard.');
    router.replace('/(tabs)');
  };
  return <Page>
    <View style={{ gap: 5 }}><Eyebrow>JOUW APP</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.7 }}>Instellingen</Text><Text style={{ color: colors.secondary }}>Kies zelf wat de app voor je bijhoudt.</Text></View>
    <SectionTitle title="Privacy en locatie" />
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><View style={{ flexDirection: 'row', gap: 9, alignItems: 'center', flex: 1 }}><AppIcon name="pin" color={colors.green} size={18} /><View style={{ gap: 3 }}><Text style={{ color: colors.ink, fontWeight: '800', fontSize: 13 }}>Locatie tijdens gebruik</Text><Text style={{ color: colors.secondary, fontSize: 11 }}>{locationStatus}</Text></View></View><Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()}><Text style={{ color: colors.green, fontWeight: '800', fontSize: 12 }}>Open</Text></Pressable></View>
      <View style={{ height: 1, backgroundColor: colors.line }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><AppIcon name="safe" color={colors.green} size={18} /><Text style={{ color: colors.ink, flex: 1, fontSize: 13, fontWeight: '700' }}>Mijn routes blijven privé</Text><AppIcon name="check" size={17} color={colors.green} /></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><AppIcon name="settings" color={colors.green} size={18} /><Text style={{ color: colors.ink, flex: 1, fontSize: 13, fontWeight: '700' }}>Persoonlijke data niet openbaar</Text><AppIcon name="check" size={17} color={colors.green} /></View>
      <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: 13, padding: 12 }}><Text style={{ color: colors.secondary, fontSize: 11, lineHeight: 17 }}>De app vraagt locatie wanneer je een route zoekt of een run start. Background-gps gebruikt meer batterij en stopt wanneer je run eindigt.</Text></View>
    </Card>
    <SectionTitle title="Herinneringen" />
    <Card style={{ paddingVertical: 4 }}>
      {([
        ['training', 'Trainingsmomenten', 'Een vriendelijke reminder voor je volgende run.'],
        ['weather', 'Weerupdates', 'Handige omstandigheden voor je run.'],
        ['races', 'Wedstrijden', 'Nieuws over lokale startbewijzen.'],
        ['safety', 'Veiligheid', 'Herinnering voor je check-in.'],
        ['challenges', 'Uitdagingen', 'Voortgang bij doelen waaraan je meedoet.'],
      ] as const).map(([key, title, subtitle], index) => <View key={key}>
        {index > 0 ? <View style={{ height: 1, backgroundColor: colors.line, marginHorizontal: 2 }} /> : null}
        <View style={{ minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>{title}</Text><Text style={{ color: colors.secondary, fontSize: 10 }}>{subtitle}</Text></View><Switch value={preferences[key]} onValueChange={(value) => void togglePreference(key, value)} trackColor={{ false: colors.line, true: colors.green }} thumbColor="#FFFFFF" accessibilityLabel={title} /></View>
      </View>)}
      <Text style={{ color: colors.muted, fontSize: 10, paddingBottom: 11 }}>Pushberichten worden pas verstuurd na het instellen van de meldingsdienst.</Text>
    </Card>
    <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><AppIcon name="moon" color={colors.green} /><View style={{ flex: 1, gap: 3 }}><Text style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>Donkere modus</Text><Text style={{ color: colors.secondary, fontSize: 11 }}>Volgt de weergave-instelling van je apparaat.</Text></View></Card>
    <SectionTitle title="Account en data" />
    <Button label="Uitloggen" kind="secondary" onPress={() => void signOut()} icon={<AppIcon name="logout" size={17} color={colors.ink} />} />
    <Pressable accessibilityRole="button" onPress={() => Alert.alert('Vraag data verwijderen aan', 'Stuur een verzoek via de GatoSports privacycontacten. Je lokale runs blijven staan tot jij ze verwijdert.')}><Text style={{ color: colors.red, fontWeight: '800', textAlign: 'center', fontSize: 12, paddingVertical: 9 }}>Verzoek om accountdata te verwijderen</Text></Pressable>
  </Page>;
}
