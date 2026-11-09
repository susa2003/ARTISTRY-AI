import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const { width } = useWindowDimensions();
  const inner = (
    <View style={[styles.content, { maxWidth: width >= 900 ? 1120 : 780 }]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView className="flex-1 bg-canvas" style={styles.safe}>
      {scroll ? <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export function Button({
  title, onPress, tone = "dark", icon, disabled = false, style,
}: {
  title: string; onPress: () => void; tone?: "dark" | "line" | "soft" | "clay";
  icon?: string; disabled?: boolean; style?: object;
}) {
  const toneStyle = tone === "dark" ? styles.button_dark : tone === "line" ? styles.button_line : tone === "soft" ? styles.button_soft : styles.button_clay;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, toneStyle, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      {icon ? <Text style={[styles.buttonIcon, tone === "dark" ? styles.buttonIconLight : null]}>{icon}</Text> : null}
      <Text style={[styles.buttonText, tone === "dark" ? styles.buttonTextLight : null]}>{title}</Text>
    </Pressable>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function AppHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable> : null}
      <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>
      {right ?? <View style={{ width: onBack ? 42 : 8 }} />}
    </View>
  );
}

export function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
    </View>
  );
}

export function InfoCard({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  content: { width: "100%", alignSelf: "center", paddingHorizontal: 16 },
  header: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  backText: { fontSize: 31, lineHeight: 33, color: colors.ink, marginTop: -4 },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: "700" },
  button: { minHeight: 48, borderRadius: 16, paddingHorizontal: 18, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 9, borderWidth: 1 },
  button_dark: { backgroundColor: colors.dark, borderColor: colors.dark },
  button_line: { backgroundColor: colors.paper, borderColor: colors.line },
  button_soft: { backgroundColor: colors.mossLight, borderColor: colors.mossLight },
  button_clay: { backgroundColor: colors.clay, borderColor: colors.clay },
  buttonText: { fontSize: 14, fontWeight: "700", color: colors.ink },
  buttonTextLight: { color: colors.white },
  buttonIcon: { fontSize: 16, color: colors.moss },
  buttonIconLight: { color: colors.white },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, color: colors.moss, fontWeight: "800", marginBottom: 9 },
  sectionHeading: { marginTop: 27, marginBottom: 13, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  sectionDetail: { color: colors.muted, fontSize: 12, flexShrink: 1, textAlign: "right" },
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 18 },
});
