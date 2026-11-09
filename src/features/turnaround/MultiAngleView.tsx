import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";
import { generateCharacterTurnaround } from "./MultiAngleEngine";
import type { MultiAngleResult } from "../../services/ai/types";

export const MultiAngleView: React.FC = () => {
  const [turnaround, setTurnaround] = useState<MultiAngleResult | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<number>(0);
  const createProject = useAppStore((state) => state.createProject);

  useEffect(() => {
    void generateCharacterTurnaround("character", "figure").then(setTurnaround);
  }, []);

  if (!turnaround) {
    return (
      <Screen>
        <AppHeader title="Multi-Angle Turnaround" onBack={() => router.back()} />
        <Text style={{ marginTop: 24, textAlign: "center", color: colors.inkMuted }}>Constructing 3D reference angles...</Text>
      </Screen>
    );
  }

  const current = turnaround.angles[selectedAngle]!;

  return (
    <Screen>
      <AppHeader title="Multi-Angle Turnaround" onBack={() => router.back()} />
      <Eyebrow>360° CHARACTER MODEL SHEET</Eyebrow>
      <Text style={styles.title}>Multi-Angle Turnaround<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Maintain proportional volume across Front, 3/4, Profile, and Rear views with horizontal height alignment rulers.
      </Text>

      {/* Angle Selector Tabs */}
      <View style={styles.tabRow}>
        {turnaround.angles.map((a, idx) => {
          const active = selectedAngle === idx;
          return (
            <Pressable key={a.name} onPress={() => setSelectedAngle(idx)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{a.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Angle Card */}
      <InfoCard style={styles.angleCard}>
        <View style={styles.angleHeader}>
          <Text style={styles.angleTitle}>{current.name} View ({current.angleDegrees}°)</Text>
        </View>

        {/* Alignment Ruler Guidelines */}
        <View style={styles.guidelinesBox}>
          <Text style={styles.guideTitle}>Key Proportional Height Locks:</Text>
          {turnaround.alignmentGuidelines.map((g) => (
            <View key={g.label} style={styles.guideRow}>
              <Text style={styles.guideLabel}>{g.label}</Text>
              <Text style={styles.guideVal}>{Math.round(g.yRatio * 100)}% height</Text>
            </View>
          ))}
        </View>

        <Button
          title={`Practice ${current.name} Angle on Canvas`}
          icon="✎"
          onPress={async () => {
            const projectId = await createProject(null, `Turnaround - ${current.name} (${current.angleDegrees}°)`);
            router.push(`/studio/${projectId}`);
          }}
          style={styles.fullBtn}
        />
      </InfoCard>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "700", color: colors.charcoal, marginTop: 4, marginBottom: 4 },
  titleDot: { color: colors.terracotta },
  note: { fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: 14 },
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 14, backgroundColor: "#EDE7DA" },
  tabActive: { backgroundColor: colors.forest },
  tabText: { fontSize: 11, fontWeight: "700", color: colors.charcoal },
  tabTextActive: { color: "#FFFFFF" },
  angleCard: { padding: 16 },
  angleHeader: { marginBottom: 12 },
  angleTitle: { fontSize: 16, fontWeight: "700", color: colors.charcoal },
  guidelinesBox: { backgroundColor: "#F7F3E9", padding: 12, borderRadius: 10, marginBottom: 14 },
  guideTitle: { fontSize: 12, fontWeight: "700", color: colors.forest, marginBottom: 8 },
  guideRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderColor: "#EBE3D3" },
  guideLabel: { fontSize: 11, color: colors.charcoal },
  guideVal: { fontSize: 11, fontWeight: "600", color: colors.inkMuted },
  fullBtn: { marginTop: 6 },
});
