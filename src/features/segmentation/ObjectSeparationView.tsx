import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";
import { processObjectSeparation } from "./ObjectSeparationEngine";

export const ObjectSeparationView: React.FC = () => {
  const reference = useAppStore((state) => state.reference);
  const setReference = useAppStore((state) => state.setReference);
  const createProject = useAppStore((state) => state.createProject);

  const [feather, setFeather] = useState(4);
  const [busy, setBusy] = useState(false);

  const handleSeparate = async () => {
    if (!reference) {
      Alert.alert("Reference Required", "Please choose a photo or sketch reference first.");
      return;
    }
    setBusy(true);
    try {
      const result = await processObjectSeparation(reference.uri);
      Alert.alert(
        "Foreground Subject Isolated!",
        `Subject bounding box extracted (${result.subjectBoundingBox.width}x${result.subjectBoundingBox.height}).`,
        [
          {
            text: "Create Cutout Project",
            onPress: async () => {
              const projectId = await createProject(result.foregroundUri, `Cutout - ${reference.name}`);
              router.push(`/studio/${projectId}`);
            },
          },
          {
            text: "Update Active Reference",
            onPress: async () => {
              await setReference({
                ...reference,
                uri: result.foregroundUri,
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
      Alert.alert("Separation Failed", "Could not isolate foreground subject.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="AI Object & Background Separation" onBack={() => router.back()} />
      <Eyebrow>SALIENCY & ALPHA MASK EXTRACTION</Eyebrow>
      <Text style={styles.title}>Object Separation<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Isolate the central subject from complex photographic backgrounds to focus drawing practice purely on character anatomy or object form.
      </Text>

      <InfoCard style={styles.card}>
        <Text style={styles.cardTitle}>Extraction Parameters</Text>
        <Text style={styles.label}>Edge Feather Radius: {feather}px</Text>
        <View style={styles.pillRow}>
          {[2, 4, 8].map((f) => (
            <Button
              key={`feather-${f}`}
              title={`${f}px`}
              tone={feather === f ? "clay" : "line"}
              onPress={() => setFeather(f)}
              style={styles.pillBtn}
            />
          ))}
        </View>

        <Button
          title={busy ? "Segmenting Subject..." : "Separate Foreground Subject"}
          icon="✦"
          disabled={busy}
          onPress={() => void handleSeparate()}
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
