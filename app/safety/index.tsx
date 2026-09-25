import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { Button, Card, Eyebrow, Page } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { useSafetySession } from '@/hooks/safety-session';
import { useRunSession } from '@/hooks/run-session';
import * as SecureStore from 'expo-secure-store';

const CONTACT_KEY = 'gato-running-emergency-contact';

export default function SafetyScreen() {
  const colors = useAppTheme();
  const { activeSession, starting, startLive, shareLive, endLive, shareCurrentLocation } = useSafetySession();
  const { status } = useRunSession();
  const [contact, setContact] = useState('');
  const [savedContact, setSavedContact] = useState('');
  const [notificationsOn, setNotificationsOn] = useState(false);
  useEffect(() => { void SecureStore.getItemAsync(CONTACT_KEY).then((value) => { if (value) { setContact(value); setSavedContact(value); } }); }, []);
  const saveContact = async () => {
    const value = contact.trim();
    if (value && value.length >= 6) {
      await SecureStore.setItemAsync(CONTACT_KEY, value);
      setSavedContact(value);
      Alert.alert('Contact bewaard', 'Je vertrouwde contact is alleen op dit apparaat opgeslagen.');
    } else Alert.alert('Controleer het contact', 'Vul een telefoonnummer of e-mailadres in.');
  };
  const contactPerson = async () => {
    if (savedContact && /^[+0-9 ().-]+$/.test(savedContact)) {
      const uri = `sms:${savedContact.replace(/[^+0-9]/g, '')}?body=${encodeURIComponent('Ik ga hardlopen. Ik laat je weten wanneer ik terug ben.')}`;
      if (await Linking.canOpenURL(uri)) return Linking.openURL(uri);
    }
    if (savedContact && savedContact.includes('@')) {
      const uri = `mailto:${savedContact}?subject=${encodeURIComponent('Ik ga hardlopen')}&body=${encodeURIComponent('Ik ga hardlopen. Ik laat je weten wanneer ik terug ben.')}`;
      if (await Linking.canOpenURL(uri)) return Linking.openURL(uri);
    }
    Alert.alert('Nog geen contact ingesteld', 'Bewaar eerst een vertrouwd telefoonnummer of e-mailadres.');
  };
  const emergency = () => Alert.alert('Bel 112 bij direct gevaar', 'Safety Mode vervangt geen hulpdiensten.', [
    { text: 'Annuleren', style: 'cancel' },
    { text: 'Bel 112', style: 'destructive', onPress: () => { void Linking.openURL('tel:112'); } },
  ]);

  return <Page>
    <View style={{ gap: 5 }}><Eyebrow>LOOP MET EEN GERUST GEVOEL</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.7 }}>Veiligheid</Text><Text style={{ color: colors.secondary, fontSize: 14, lineHeight: 20 }}>Laat iemand weten dat je op pad bent. Jij bepaalt wat je deelt.</Text></View>
    <Card style={{ backgroundColor: colors.ink, borderColor: colors.ink, padding: 18, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}><View style={{ width: 39, height: 39, borderRadius: 14, backgroundColor: 'rgba(199,243,107,.16)', alignItems: 'center', justifyContent: 'center' }}><AppIcon name="safe" color={colors.lime} size={20} /></View><View><Eyebrow color={colors.lime}>LIVE SAFETY MODE</Eyebrow><Text style={{ color: '#F2F6EF', fontSize: 16, fontWeight: '800', marginTop: 3 }}>{activeSession ? 'Je locatie wordt gedeeld' : 'Delen staat uit'}</Text></View></View><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: activeSession ? colors.lime : '#6B7E6D' }} /></View>
      <Text style={{ color: '#B8C6B7', fontSize: 12, lineHeight: 18 }}>{activeSession ? 'Alleen iemand met jouw tijdelijke link ziet de laatste locatie. De link verloopt automatisch.' : 'Start een tijdelijke link en stuur die zelf naar iemand die je vertrouwt.'}</Text>
      {activeSession ? <View style={{ gap: 9 }}><Button label="Deel live link" onPress={() => void shareLive()} style={{ minHeight: 45 }} /><Button label="Safety Mode stoppen" kind="secondary" onPress={() => void endLive()} style={{ minHeight: 43, backgroundColor: '#23342A', borderColor: '#3C5040' }} /></View> : <Button label={starting ? 'Veilige link maken…' : status === 'running' || status === 'paused' ? 'Start live Safety Mode' : 'Start je run om live te delen'} onPress={() => void startLive()} disabled={starting || status !== 'running' && status !== 'paused'} style={{ minHeight: 45 }} />}
      {status !== 'running' && status !== 'paused' ? <Text style={{ color: '#829384', fontSize: 10 }}>Live delen start pas tijdens een run. Een eenmalige check-in kan altijd.</Text> : null}
    </Card>
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <View style={{ width: 39, height: 39, borderRadius: 14, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="pin" color={colors.green} size={18} /></View>
      <View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.ink, fontWeight: '800', fontSize: 14 }}>Eenmalige check-in</Text><Text style={{ color: colors.secondary, fontSize: 11, lineHeight: 16 }}>Deel een kaart-pin voor je huidige plek. Dit is geen live tracking.</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Deel mijn huidige locatie" onPress={() => void shareCurrentLocation()}><AppIcon name="share" color={colors.green} size={19} /></Pressable>
    </Card>
    <Card style={{ gap: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><AppIcon name="heart" color={colors.green} size={19} /><Text style={{ color: colors.ink, fontSize: 15, fontWeight: '800' }}>Vertrouwd contact</Text></View>
      <Text style={{ color: colors.secondary, fontSize: 12, lineHeight: 18 }}>Bewaar iemand die je makkelijk een bericht kunt sturen voordat je vertrekt.</Text>
      <View style={{ minHeight: 48, borderRadius: 15, borderColor: colors.line, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AppIcon name="profile" size={17} color={colors.muted} /><TextInput value={contact} onChangeText={setContact} placeholder="Telefoonnummer of e-mailadres" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" style={{ flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 10 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}><Button label={savedContact ? 'Wijzig contact' : 'Bewaar contact'} kind="secondary" onPress={() => void saveContact()} style={{ flex: 1, minHeight: 43 }} /><Button label="Stuur check-in" onPress={() => void contactPerson()} style={{ flex: 1, minHeight: 43 }} /></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}><View style={{ flex: 1, gap: 3 }}><Text style={{ color: colors.ink, fontWeight: '700', fontSize: 13 }}>Veiligheidsherinneringen</Text><Text style={{ color: colors.secondary, fontSize: 11 }}>Alleen op dit apparaat ingesteld</Text></View><Switch value={notificationsOn} onValueChange={setNotificationsOn} trackColor={{ false: colors.line, true: colors.green }} thumbColor="#FFFFFF" accessibilityLabel="Veiligheidsherinneringen" /></View>
    </Card>
    <Pressable accessibilityRole="button" onPress={emergency} style={{ minHeight: 55, backgroundColor: colors.red, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}><AppIcon name="heart" color="#FFFFFF" /><Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>Bel 112 bij direct gevaar</Text></Pressable>
    <Card style={{ padding: 13 }}><Text style={{ color: colors.secondary, fontSize: 11, lineHeight: 17 }}>Safety Mode helpt je een run te delen met iemand die je vertrouwt. Het vervangt geen hulpdiensten. We delen geen exacte route zonder dat je zelf een tijdelijke link start.</Text></Card>
  </Page>;
}
