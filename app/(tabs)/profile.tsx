import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { Card, Eyebrow, Page, SectionTitle } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { demoProfile } from '@/data/demo';
import { secureSession } from '@/lib/auth-storage';

const menu = [
  { label: 'Mijn runs', detail: 'Jouw hardloopgeschiedenis', icon: 'run' as const, href: '/run/history' as const },
  { label: 'Hardloopuitrusting', detail: 'Bekijk passende gear', icon: 'shoe' as const, href: '/products' as const },
  { label: 'Veiligheid', detail: 'Check-in en delen', icon: 'safe' as const, href: '/safety' as const },
  { label: 'Instellingen', detail: 'Privacy, voorkeuren en thema', icon: 'settings' as const, href: '/settings' as const },
];

export default function ProfileScreen() {
  const colors = useAppTheme();
  const [profile, setProfile] = useState(demoProfile);
  const name = profile.name;
  const [hasAccount, setHasAccount] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([secureSession.getProfile<Partial<typeof demoProfile>>(), secureSession.getToken()]).then(([savedProfile, token]) => {
      if (!active) return;
      if (savedProfile) setProfile({ ...demoProfile, ...savedProfile });
      setHasAccount(Boolean(token));
    });
    return () => { active = false; };
  }, []));
  return <Page>
    <View style={{ gap: 5 }}><Eyebrow>MIJN HARDLOOPLEVEN</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 }}>Profiel</Text></View>
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 60, height: 60, borderRadius: 21, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.limeInk, fontWeight: '900', fontSize: 24 }}>{name.slice(0, 1).toUpperCase()}</Text></View>
      <View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.ink, fontSize: 18, fontWeight: '800' }}>{name}</Text><Text style={{ color: colors.secondary, fontSize: 12 }}>{hasAccount ? 'GatoSports-account' : 'Gastprofiel · lokaal opgeslagen'}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={hasAccount ? 'Profiel aanpassen' : 'Account aanmaken'} onPress={() => router.push('/auth')}><AppIcon name="chevron" color={colors.green} /></Pressable>
    </Card>
    <Card style={{ backgroundColor: colors.ink, borderColor: colors.ink, padding: 17 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow color={colors.lime}>JOUW DOEL</Eyebrow><AppIcon name="target" size={20} color={colors.lime} /></View>
      <Text style={{ color: '#F4F7F1', fontSize: 18, fontWeight: '800', marginTop: 11 }}>{profile.goal}</Text>
      <Text style={{ color: '#B9C8B8', fontSize: 13, marginTop: 4 }}>{profile.runsPerWeek} · {profile.preferredDistance}</Text>
    </Card>
    <View style={{ gap: 10 }}>
      <SectionTitle title="Mijn gegevens" />
      {menu.map((item) => <Pressable key={item.label} accessibilityRole="button" onPress={() => router.push(item.href)}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 13 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><AppIcon name={item.icon} size={20} color={colors.green} /></View>
          <View style={{ flex: 1, gap: 3, marginLeft: 12 }}><Text style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>{item.label}</Text><Text style={{ color: colors.secondary, fontSize: 11 }}>{item.detail}</Text></View>
          <AppIcon name="chevron" size={17} color={colors.muted} />
        </Card>
      </Pressable>)}
    </View>
    {!hasAccount ? <Card style={{ gap: 9 }}>
      <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}><AppIcon name="spark" size={18} color={colors.green} /><Text style={{ color: colors.ink, fontWeight: '800', fontSize: 14 }}>Bewaar je runs ook online</Text></View>
      <Text style={{ color: colors.secondary, fontSize: 12, lineHeight: 18 }}>Maak gratis een account om je hardloopgeschiedenis op meerdere apparaten te gebruiken.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/auth')}><Text style={{ color: colors.green, fontWeight: '800', fontSize: 13 }}>Account maken →</Text></Pressable>
    </Card> : null}
    <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 11 }}>GatoSports Running · versie 0.1</Text>
  </Page>;
}
