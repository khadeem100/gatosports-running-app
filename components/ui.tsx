import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/app-icon';
import { radius, spacing, useAppTheme } from '@/constants/theme';

export function Page({ children, contentStyle, bottom = 24 }: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle>; bottom?: number }>) {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top, 12) + 12, paddingBottom: bottom + insets.bottom }, contentStyle]}
    >
      {children}
    </ScrollView>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  const colors = useAppTheme();
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandMark, { backgroundColor: colors.lime }]}>
        <Text style={styles.brandMarkText}>G</Text>
      </View>
      {!compact ? <View>
        <Text style={[styles.brandName, { color: colors.ink }]}>GATOSPORTS</Text>
        <Text style={[styles.brandCaption, { color: colors.secondary }]}>RUNNING</Text>
      </View> : null}
    </View>
  );
}

export function Eyebrow({ children, color }: PropsWithChildren<{ color?: string }>) {
  const colors = useAppTheme();
  return <Text style={[styles.eyebrow, { color: color ?? colors.secondary }]}>{children}</Text>;
}

export function Heading({ title, subtitle, trailing }: { title: string; subtitle?: string; trailing?: ReactNode }) {
  const colors = useAppTheme();
  return (
    <View style={styles.headingRow}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.ink }]}>{title}</Text>
        {subtitle ? <Text style={[styles.body, { color: colors.secondary }]}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useAppTheme();
  return (
    <View style={styles.sectionRow}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
      {action && onAction ? <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10}>
        <Text style={[styles.link, { color: colors.green }]}>{action}</Text>
      </Pressable> : null}
    </View>
  );
}

export function Card({ children, style, padded = true }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; padded?: boolean }>) {
  const colors = useAppTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, padding: padded ? spacing.md : 0, boxShadow: `0 5px 18px ${colors.shadow}` }, style]}>{children}</View>;
}

export function Button({ label, onPress, kind = 'primary', icon, disabled = false, style }: {
  label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'quiet' | 'danger'; icon?: ReactNode; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const colors = useAppTheme();
  const backgroundColor = kind === 'primary' ? colors.lime : kind === 'danger' ? colors.red : kind === 'secondary' ? colors.surface : 'transparent';
  const textColor = kind === 'primary' ? colors.limeInk : kind === 'danger' ? '#FFFFFF' : kind === 'secondary' ? colors.ink : colors.green;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, { backgroundColor, borderColor: kind === 'secondary' ? colors.line : 'transparent', opacity: disabled ? 0.48 : pressed ? 0.82 : 1 }, style]}
    >
      {icon}
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, selected = false, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: ReactNode }) {
  const colors = useAppTheme();
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper accessibilityRole={onPress ? 'button' : undefined} accessibilityState={onPress ? { selected } : undefined} onPress={onPress as (() => void) | undefined}
      style={[styles.pill, { backgroundColor: selected ? colors.ink : colors.surface, borderColor: selected ? colors.ink : colors.line }]}>
      {icon}
      <Text style={{ color: selected ? colors.bg : colors.secondary, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </Wrapper>
  );
}

export function IconButton({ name, label, onPress, tint }: { name: React.ComponentProps<typeof AppIcon>['name']; label: string; onPress: () => void; tint?: string }) {
  const colors = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.line }]}>
    <AppIcon name={name} size={19} color={tint ?? colors.ink} />
  </Pressable>;
}

export function Metric({ label, value, unit, color, valueStyle }: { label: string; value: string; unit?: string; color?: string; valueStyle?: StyleProp<TextStyle> }) {
  const colors = useAppTheme();
  return <View style={{ gap: 4 }}>
    <Text style={[styles.metricLabel, { color: colors.secondary }]}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
      <Text style={[styles.metricValue, { color: color ?? colors.ink }, valueStyle]}>{value}</Text>
      {unit ? <Text style={[styles.metricUnit, { color: colors.secondary }]}>{unit}</Text> : null}
    </View>
  </View>;
}

export function Divider() {
  const colors = useAppTheme();
  return <View style={{ height: 1, backgroundColor: colors.line }} />;
}

export function InlineIconText({ icon, text, color }: { icon: React.ComponentProps<typeof AppIcon>['name']; text: string; color?: string }) {
  const colors = useAppTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <AppIcon name={icon} size={14} color={color ?? colors.secondary} />
    <Text style={{ color: color ?? colors.secondary, fontSize: 12, fontWeight: '600' }}>{text}</Text>
  </View>;
}

export function EmptyState({ title, text, icon = 'spark', action }: { title: string; text: string; icon?: React.ComponentProps<typeof AppIcon>['name']; action?: ReactNode }) {
  const colors = useAppTheme();
  return <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingVertical: 34, gap: 12 }}>
    <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
      <AppIcon name={icon} color={colors.green} size={25} />
    </View>
    <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
    <Text style={{ color: colors.secondary, fontSize: 14, lineHeight: 21, textAlign: 'center' }}>{text}</Text>
    {action}
  </View>;
}

const styles = StyleSheet.create({
  pageContent: { paddingHorizontal: spacing.md, gap: spacing.lg, flexGrow: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#183222', fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  brandName: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  brandCaption: { fontSize: 9, fontWeight: '800', letterSpacing: 2.8, marginTop: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heading: { fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.6 },
  body: { fontSize: 14, lineHeight: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  link: { fontSize: 13, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  button: { minHeight: 54, borderRadius: radius.pill, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, borderWidth: 1 },
  buttonText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  pill: { minHeight: 36, borderRadius: radius.pill, paddingHorizontal: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  iconButton: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  metricValue: { fontSize: 26, lineHeight: 31, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metricUnit: { fontSize: 12, fontWeight: '700' },
});
