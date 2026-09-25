import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { Brand, Button, Card, Eyebrow } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';

export default function Welcome() {
  const colors = useAppTheme();
  return <View style={[styles.page, { backgroundColor: colors.bg }]}>
    <View style={styles.top}><Brand /><View style={styles.badge}><AppIcon name="sun" size={15} color={colors.green} /><Text style={[styles.badgeText, { color: colors.green }]}>RUN MET JE DAG MEE</Text></View></View>
    <View style={styles.hero}>
      <View style={[styles.sunBlob, { backgroundColor: colors.lime }]} />
      <View style={[styles.lineOne, { borderColor: colors.green }]} />
      <View style={[styles.lineTwo, { borderColor: colors.green }]} />
      <View style={styles.runner}><AppIcon name="run" size={104} color={colors.green} strokeWidth={1.35} /></View>
      <View style={[styles.heroLabel, { backgroundColor: colors.ink }]}>
        <Text style={{ color: colors.bg, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }}>ELKE RUN BEGINT MET ÉÉN STAP</Text>
      </View>
    </View>
    <View style={styles.copy}>
      <Eyebrow>JOUW HARDLOOPMAATJE</Eyebrow>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>Meer lopen.{ '\n' }Meer buiten.{ '\n'}Meer jezelf.</Text>
      <Text style={[styles.description, { color: colors.secondary }]}>Routes, weer en vooruitgang op één plek. Zodat je met vertrouwen de deur uitgaat.</Text>
    </View>
    <View style={{ gap: 12 }}>
      <Button label="Begin met hardlopen" onPress={() => router.push('/onboarding')} icon={<AppIcon name="arrow" size={18} color={colors.limeInk} />} />
      <Button label="Ik heb al een account" kind="quiet" onPress={() => router.push('/auth')} />
    </View>
    <Card style={styles.note}>
      <AppIcon name="heart" size={20} color={colors.green} />
      <Text style={[styles.noteText, { color: colors.secondary }]}>Handig voor je runs. Ook als je vandaag niets koopt.</Text>
    </Card>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 22, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 11, backgroundColor: 'rgba(153,196,135,.16)', borderRadius: 99 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  hero: { height: 245, overflow: 'hidden', borderRadius: 28, backgroundColor: '#E3EDDC', justifyContent: 'center', alignItems: 'center' },
  sunBlob: { width: 134, height: 134, borderRadius: 67, opacity: 0.88, position: 'absolute', top: 15, right: 33 },
  lineOne: { width: '150%', height: 115, borderWidth: 2, borderRadius: 120, position: 'absolute', bottom: -50, transform: [{ rotate: '-8deg' }] },
  lineTwo: { width: '140%', height: 90, borderWidth: 2, borderRadius: 100, position: 'absolute', bottom: -61, transform: [{ rotate: '6deg' }] },
  runner: { marginTop: 18, marginLeft: 40, transform: [{ rotate: '-10deg' }] },
  heroLabel: { position: 'absolute', bottom: 17, left: 17, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 9 },
  copy: { gap: 11 },
  title: { fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.2 },
  description: { fontSize: 15, lineHeight: 22, maxWidth: 320 },
  note: { flexDirection: 'row', alignItems: 'center', padding: 13, gap: 10 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
