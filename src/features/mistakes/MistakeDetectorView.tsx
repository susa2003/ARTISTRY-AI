import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";
import { detectDrawingMistakes } from "./MistakeDetectorEngine";
import type { MistakeDetectionResult } from "../../services/ai/types";

export const MistakeDetectorView: React.FC = () => {
  const [result, setResult] = useState<MistakeDetectionResult | null>(null);
  const currentProject = useAppStore((state) => state.currentProject);

  useEffect(() => {
    void detectDrawingMistakes().then(setResult);
  }, []);

  if (!result) {
    return (
      <Screen>
        <AppHeader title="AI Mistake Detector" onBack={() => router.back()} />
        <Text style={{ marginTop: 24, textAlign: "center", color: colors.inkMuted }}>Analyzing structural errors...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="AI Mistake Detector" onBack={() => router.back()} />
      <Eyebrow>DIAGNOSTIC ANATOMY & PERSPECTIVE AUDIT</Eyebrow>
      <Text style={styles.title}>AI Mistake Detector<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Pinpoint eye-level slants, flattened skull curves, proportional misalignments, and premature value darks.
      </Text>

      {/* Encouragement Card */}
      <InfoCard style={[styles.card, { backgroundColor: "#F7F3E9" }]}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>{result.overallFidelityScore}%</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreTitle}>Structural Integrity</Text>
            <Text style={styles.encouragementText}>{result.encouragement}</Text>
          </View>
        </View>
      </InfoCard>

      {/* Mistake Items */}
      <Text style={styles.sectionHeading}>Detected Anomalies ({result.mistakes.length})</Text>
      {result.mistakes.map((m) => {
        const severityColor = m.severity === "critical" ? "#C0392B" : m.severity === "moderate" ? "#D35400" : "#27AE60";
        return (
          <InfoCard key={m.id} style={styles.mistakeCard}>
            <View style={styles.mistakeHeader}>
              <Text style={styles.mistakeTitle}>{m.title}</Text>
              <View style={[styles.sevBadge, { backgroundColor: severityColor }]}>
                <Text style={styles.sevText}>{m.severity.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.mistakeDesc}>{m.description}</Text>
            <View style={styles.correctionBox}>
              <Text style={styles.actionTitle}>Recommended Correction:</Text>
              <Text style={styles.actionText}>{m.correctionAction}</Text>
            </View>
          </InfoCard>
        );
      })}

      <Button
        title="Open Studio Canvas to Correct"
        icon="✎"
        onPress={() => {
          if (currentProject) {
            router.push(`/studio/${currentProject.id}`);
          } else {
            router.push("/projects");
          }
        }}
        style={{ marginTop: 8 }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "700", color: colors.charcoal, marginTop: 4, marginBottom: 4 },
  titleDot: { color: colors.terracotta },
  note: { fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: 14 },
  card: { padding: 14, marginBottom: 14 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  scoreText: { fontSize: 32, fontWeight: "800", color: colors.forest },
  scoreTitle: { fontSize: 14, fontWeight: "700", color: colors.charcoal },
  encouragementText: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  sectionHeading: { fontSize: 14, fontWeight: "700", color: colors.charcoal, marginBottom: 8 },
  mistakeCard: { padding: 14, marginBottom: 10 },
  mistakeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  mistakeTitle: { fontSize: 14, fontWeight: "700", color: colors.charcoal },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sevText: { fontSize: 9, fontWeight: "700", color: "#FFFFFF" },
  mistakeDesc: { fontSize: 12, color: colors.inkMuted, lineHeight: 16, marginBottom: 8 },
  correctionBox: { backgroundColor: "#F9F6F0", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#EBE3D3" },
  actionTitle: { fontSize: 11, fontWeight: "700", color: colors.forest, marginBottom: 2 },
  actionText: { fontSize: 11, color: colors.charcoal },
});
