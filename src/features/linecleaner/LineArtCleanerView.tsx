import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";
import { processLineArtCleaning } from "./LineArtCleanerEngine";

export const LineArtCleanerView: React.FC = () => {
  const reference = useAppStore((state) => state.reference);
  const setReference = useAppStore((state) => state.setReference);
  const createProject = useAppStore((state) => state.createProject);

  const [threshold, setThreshold] = useState(160);
  const [smoothing, setSmoothing] = useState(3);
  const [busy, setBusy] = useState(false);

  const handleClean = async () => {
    if (!reference) {
      Alert.alert("Reference Required", "Please choose a photo or sketch reference first.");
      return;
    }
    setBusy(true);
    try {
      const cleanedUri = await processLineArtCleaning(reference.uri, {
        threshold,
        smoothing,
        removeNoise: true,
        enhanceEdges: true,
      });

      Alert.alert(
        "Line Art Cleaned!",
        "Paper texture and scanner noise removed. Choose how to use the clean line art:",
        [
          {
            text: "Create Clean Project",
            onPress: async () => {
              const projectId = await createProject(cleanedUri, `Clean Line Art - ${reference.name}`);
              router.push(`/studio/${projectId}`);
            },
          },
          {
            text: "Set as Active Reference",
            onPress: async () => {
              await setReference({
                ...reference,
                uri: cleanedUri,
                isEdited: true,
                updatedAt: Date.now(),
              });
              router.push("/reference");
            },
          },
          { text: "Done" },
        ]
      );
    } catch {
      Alert.alert("Cleaning Failed", "Could not clean sketch noise.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="AI Line Art Cleaner" onBack={() => router.back()} />
      <Eyebrow>BACKGROUND NOISE & SMUDGE REMOVAL</Eyebrow>
      <Text style={styles.title}>Line Art Cleaner<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Binarize hand-drawn sketches by filtering graphite paper glare, smudges, and scan dust into crisp outlines.
      </Text>

      <InfoCard style={styles.card}>
        <Text style={styles.cardTitle}>Filter Controls</Text>
        <Text style={styles.label}>Binarization Threshold: {threshold}</Text>
        <View style={styles.pillRow}>
          {[120, 160, 200].map((t) => (
            <Button
              key={`th-${t}`}
              title={`${t}`}
              tone={threshold === t ? "clay" : "line"}
              onPress={() => setThreshold(t)}
              style={styles.pillBtn}
            />
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Morphological Smoothing: {smoothing}px</Text>
        <View style={styles.pillRow}>
          {[1, 3, 5].map((s) => (
            <Button
              key={`sm-${s}`}
              title={`${s}px`}
              tone={smoothing === s ? "clay" : "line"}
              onPress={() => setSmoothing(s)}
              style={styles.pillBtn}
            />
          ))}
        </View>

        <Button
          title={busy ? "Cleaning Outlines..." : "Clean Line Art"}
          icon="✦"
          disabled={busy}
          onPress={() => void handleClean()}
          style={{ marginTop: 16 }}
        />
      </InfoCard>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "700", color: colors.charcoal, marginTop: 4, marginBottom: 4 },
  titleDot: { color: colors.terracotta },
  note: { fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: 14 },
  card: { padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.charcoal, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "600", color: colors.charcoal, marginBottom: 6 },
  pillRow: { flexDirection: "row", gap: 8 },
  pillBtn: { flex: 1 },
});
