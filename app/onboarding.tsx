import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Brand, Button, Card, Eyebrow, IconButton } from '@/components/ui';
import { useAppTheme } from '@/constants/theme';
import { secureSession } from '@/lib/auth-storage';
import { AppIcon } from '@/components/app-icon';

const steps = [
  { title: 'Waar loop je naartoe?', help: 'Kies wat je nu belangrijk vindt.', options: ['Lekker in beweging', 'Mijn eerste 5 km', 'Sneller worden', 'Een langere afstand'] },
  { title: 'Hoe vaak past het?', help: 'Je kunt dit later altijd aanpassen.', options: ['Ik begin net', '1 keer per week', '2 keer per week', '3 keer of vaker'] },
  { title: 'Waar loop je graag?', help: 'Dan kunnen we betere routes voorstellen.', options: ['Parken', 'Stad', 'Bos & paden', 'Van alles wat'] },
];

export default function Onboarding() {
  const colors = useAppTheme();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const current = steps[step];
  const finish = async () => {
    await secureSession.setOnboardingComplete();
    await secureSession.setProfile({
      id: 'guest-runner', name: 'Hardloper', goal: selected[0] ?? 'Blijf lekker in beweging',
      runsPerWeek: selected[1] ?? '2 keer per week', preferredDistance: '5–10 km', terrain: selected[2] ?? 'Parken',
    });
    router.replace('/(tabs)');
  };
  return <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22, gap: 24 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <IconButton name="back" label="Vorige stap" onPress={() => step === 0 ? router.back() : setStep(step - 1)} />
      <Brand compact />
      <Pressable accessibilityRole="button" onPress={finish} hitSlop={8}><Text style={{ color: colors.secondary, fontWeight: '700' }}>Overslaan</Text></Pressable>
    </View>
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {steps.map((_, i) => <View key={i} style={{ height: 5, flex: 1, borderRadius: 99, backgroundColor: i <= step ? colors.green : colors.line }} />)}
    </View>
    <View style={{ gap: 8 }}><Eyebrow>STAP {step + 1} VAN {steps.length}</Eyebrow><Text accessibilityRole="header" style={{ color: colors.ink, fontWeight: '900', fontSize: 30, letterSpacing: -0.7 }}>{current.title}</Text><Text style={{ color: colors.secondary, fontSize: 15 }}>{current.help}</Text></View>
    <View style={{ gap: 10 }}>
      {current.options.map((option, index) => {
        const isSelected = selected[step] === option;
        return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: isSelected }} onPress={() => {
          const next = [...selected]; next[step] = option; setSelected(next);
        }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', minHeight: 69, paddingHorizontal: 15, paddingVertical: 12, borderColor: isSelected ? colors.green : colors.line, backgroundColor: isSelected ? colors.surfaceMuted : colors.surface }}>
            <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: isSelected ? colors.lime : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.green, fontSize: 15, fontWeight: '900' }}>{['01', '02', '03', '04'][index]}</Text>
            </View>
            <Text style={{ color: colors.ink, flex: 1, fontWeight: '700', marginLeft: 12 }}>{option}</Text>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: isSelected ? colors.green : colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? colors.green : 'transparent' }}>
              {isSelected ? <AppIcon name="check" size={14} color="#FFFFFF" strokeWidth={2.2} /> : null}
            </View>
          </Card>
        </Pressable>;
      })}
    </View>
    <View style={{ flex: 1 }} />
    <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 13 }}>
      <AppIcon name="pin" size={18} color={colors.green} />
      <Text style={{ color: colors.secondary, flex: 1, fontSize: 12, lineHeight: 18 }}>Je locatie vragen we pas als je een route zoekt of je run start.</Text>
    </Card>
    <Button label={step === steps.length - 1 ? 'Naar mijn startpagina' : 'Verder'} disabled={!selected[step]} onPress={() => step === steps.length - 1 ? void finish() : setStep(step + 1)} icon={<AppIcon name="arrow" size={18} color={colors.limeInk} />} />
  </View>;
}
