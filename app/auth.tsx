import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { Button, Card, Eyebrow } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { api, hasApi } from '@/lib/api';
import { secureSession } from '@/lib/auth-storage';

export default function AuthScreen() {
  const colors = useAppTheme();
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setError('');
    if (!email.includes('@')) { setError('Vul een geldig e-mailadres in.'); return; }
    if (password.length < 10) { setError('Gebruik minimaal 10 tekens voor je wachtwoord.'); return; }
    if (registering && name.trim().length < 2) { setError('Vul je naam in.'); return; }
    if (!hasApi) { setError('De accountserver is nog niet verbonden. Je kunt de app wel als gast gebruiken.'); return; }
    setBusy(true);
    try {
      if (registering) await api.register(email.trim().toLowerCase(), password, name.trim());
      else await api.signIn(email.trim().toLowerCase(), password);
      await secureSession.setOnboardingComplete();
      router.replace('/(tabs)');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Probeer het straks nog eens.';
      setError(message);
    } finally { setBusy(false); }
  };
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg, padding: 22, paddingTop: 22, gap: 21 }}>
    <View style={{ width: 54, height: 54, borderRadius: 19, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="run" size={28} color={colors.limeInk} /></View>
    <View style={{ gap: 6 }}><Eyebrow>GATOSPORTS RUNNING</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 28, fontWeight: '900', letterSpacing: -0.6 }}>{registering ? 'Loop met ons mee.' : 'Welkom terug.'}</Text><Text style={{ color: colors.secondary, fontSize: 14, lineHeight: 20 }}>{registering ? 'Bewaar je runs veilig en neem je voortgang met je mee.' : 'Log in om je trainingen veilig te synchroniseren.'}</Text></View>
    <Card style={{ gap: 12 }}>
      {registering ? <View style={{ gap: 6 }}><Text style={{ color: colors.ink, fontSize: 12, fontWeight: '800' }}>Naam</Text><TextInput value={name} onChangeText={setName} placeholder="Je naam" placeholderTextColor={colors.muted} autoCapitalize="words" style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, color: colors.ink }} /></View> : null}
      <View style={{ gap: 6 }}><Text style={{ color: colors.ink, fontSize: 12, fontWeight: '800' }}>E-mailadres</Text><TextInput value={email} onChangeText={setEmail} placeholder="jij@voorbeeld.nl" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, color: colors.ink }} /></View>
      <View style={{ gap: 6 }}><Text style={{ color: colors.ink, fontSize: 12, fontWeight: '800' }}>Wachtwoord</Text><TextInput value={password} onChangeText={setPassword} placeholder="Minimaal 10 tekens" placeholderTextColor={colors.muted} secureTextEntry autoComplete={registering ? 'new-password' : 'current-password'} style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, color: colors.ink }} /></View>
      {error ? <View style={{ backgroundColor: '#FCE8E5', borderRadius: 12, padding: 10 }}><Text style={{ color: colors.red, fontSize: 12, lineHeight: 17 }}>{error}</Text></View> : null}
      <Button label={busy ? 'Even geduld…' : registering ? 'Maak mijn account' : 'Log in'} disabled={busy} onPress={() => void submit()} />
    </Card>
    <Pressable accessibilityRole="button" onPress={() => { setRegistering(!registering); setError(''); }}><Text style={{ color: colors.green, textAlign: 'center', fontWeight: '800', fontSize: 13 }}>{registering ? 'Ik heb al een account' : 'Nieuw bij GatoSports? Maak een account'}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => { void secureSession.setOnboardingComplete(); router.replace('/(tabs)'); }}><Text style={{ color: colors.secondary, textAlign: 'center', fontWeight: '700', fontSize: 12, padding: 7 }}>Verder als gast op dit apparaat</Text></Pressable>
    <View style={{ flex: 1 }} />
    <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 10, lineHeight: 15 }}>Je wachtwoord wordt beveiligd opgeslagen. Runs en locatie worden nooit openbaar getoond.</Text>
  </KeyboardAvoidingView>;
}
