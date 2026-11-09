import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";
import {
  REFERENCE_CATEGORIES,
  fetchGeneratedReferences,
  removeGeneratedReference,
  requestReferenceGeneration,
} from "./ReferenceGeneratorEngine";
import type { GeneratedReferenceRecord } from "../../domain/types";
import type { ReferenceCategory } from "../../services/ai/types";

export const ReferenceGeneratorView: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<ReferenceCategory>("portraits");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<"realistic" | "line_drawing" | "anime" | "classical" | "concept_art">("realistic");
  const [lighting, setLighting] = useState<"front" | "side_left" | "side_right" | "top" | "dramatic_rim">("front");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<GeneratedReferenceRecord[]>([]);

  const experienceMode = useAppStore((state) => state.experienceMode);
  const setReference = useAppStore((state) => state.setReference);
  const createProject = useAppStore((state) => state.createProject);

  const loadHistory = async () => {
    const list = await fetchGeneratedReferences();
    setHistory(list);
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const record = await requestReferenceGeneration({
        category: selectedCat,
        prompt: prompt.trim() || `${selectedCat} academic drawing study`,
        style,
        lighting,
      });
      await loadHistory();
      Alert.alert(
        "Reference Generated!",
        "Generated using local vector synthesis engine (100% offline & copyright-free).",
        [
          {
            text: "Draw on Canvas",
            onPress: async () => {
              const projectId = await createProject(record.uri, `Generated - ${record.category}`);
              router.push(`/studio/${projectId}`);
            },
          },
          { text: "Done" },
        ]
      );
    } catch (e) {
      Alert.alert("Generation Failed", e instanceof Error ? e.message : "Error generating reference.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="AI Reference Generator" onBack={() => router.back()} />
      <Eyebrow>OFFLINE SYNTHESIS & INSPIRATION</Eyebrow>
      <Text style={styles.title}>Reference Generator<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Generate copyright-free reference poses across 11 categories with procedural offline vector synthesis.
      </Text>

      {/* Category Selection Carousel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {REFERENCE_CATEGORIES.map((cat) => {
          const active = selectedCat === cat.id;
          return (
            <Pressable key={cat.id} onPress={() => setSelectedCat(cat.id)} style={[styles.catPill, active && styles.catPillActive]}>
              <Text style={[styles.catPillText, active && styles.catPillTextActive]}>{cat.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Generator Controls */}
      <InfoCard style={styles.controlCard}>
        <Text style={styles.cardHeading}>Prompt & Subject Details</Text>
        <TextInput
          style={styles.promptInput}
          placeholder="e.g. 3/4 turn female face with dramatic chiaroscuro lighting..."
          placeholderTextColor="#88928A"
          value={prompt}
          onChangeText={setPrompt}
        />

        <Text style={styles.subHeading}>Artistic Style:</Text>
        <View style={styles.pillRow}>
          {(["realistic", "line_drawing", "anime", "classical", "concept_art"] as const).map((s) => (
            <Pressable key={s} onPress={() => setStyle(s)} style={[styles.pill, style === s && styles.pillActive]}>
              <Text style={[styles.pillText, style === s && styles.pillTextActive]}>{s.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </View>

        {experienceMode === "professional" && (
          <>
            <Text style={styles.subHeading}>Key Lighting Vector:</Text>
            <View style={styles.pillRow}>
              {(["front", "side_left", "side_right", "top", "dramatic_rim"] as const).map((l) => (
                <Pressable key={l} onPress={() => setLighting(l)} style={[styles.pill, lighting === l && styles.pillActive]}>
                  <Text style={[styles.pillText, lighting === l && styles.pillTextActive]}>{l.replace("_", " ")}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Button
          title={busy ? "Generating Vector Template..." : "Generate Reference Model"}
          icon="✦"
          disabled={busy}
          onPress={() => void handleGenerate()}
          style={styles.fullButton}
        />
      </InfoCard>

      {/* Generated References History */}
      {history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Saved Generated References ({history.length})</Text>
          <View style={styles.historyGrid}>
            {history.map((item) => (
              <InfoCard key={item.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyCategory}>{item.category.toUpperCase()}</Text>
                  <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.historyPrompt} numberOfLines={2}>"{item.prompt}"</Text>
                <View style={styles.historyBtnRow}>
                  <Button
                    title="Draw on Canvas"
                    icon="✎"
                    onPress={async () => {
                      const projectId = await createProject(item.uri, `Study - ${item.category}`);
                      router.push(`/studio/${projectId}`);
                    }}
                    style={styles.halfBtn}
                  />
                  <Button
                    title="Delete"
                    icon="✕"
                    tone="line"
                    onPress={async () => {
                      await removeGeneratedReference(item.id);
                      void loadHistory();
                    }}
                    style={styles.halfBtn}
                  />
                </View>
              </InfoCard>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "700", color: colors.charcoal, marginTop: 4, marginBottom: 4 },
  titleDot: { color: colors.terracotta },
  note: { fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: 14 },
  categoryScroll: { gap: 8, paddingBottom: 12 },
  catPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#EBE5D8", borderWidth: 1, borderColor: "#D5CEBF" },
  catPillActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  catPillText: { fontSize: 12, fontWeight: "600", color: colors.charcoal },
  catPillTextActive: { color: "#FFFFFF" },
  controlCard: { padding: 16, marginBottom: 16 },
  cardHeading: { fontSize: 14, fontWeight: "700", color: colors.charcoal, marginBottom: 8 },
  subHeading: { fontSize: 12, fontWeight: "600", color: colors.inkMuted, marginTop: 12, marginBottom: 6 },
  promptInput: {
    backgroundColor: "#F9F6F0",
    borderWidth: 1,
    borderColor: "#DCD5C5",
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: colors.charcoal,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: "#EDE7DA" },
  pillActive: { backgroundColor: colors.forest },
  pillText: { fontSize: 11, fontWeight: "600", color: colors.charcoal },
  pillTextActive: { color: "#FFFFFF" },
  fullButton: { marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.charcoal, marginVertical: 12 },
  historyGrid: { gap: 10 },
  historyCard: { padding: 14 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  historyCategory: { fontSize: 11, fontWeight: "700", color: colors.forest },
  historyDate: { fontSize: 11, color: colors.inkMuted },
  historyPrompt: { fontSize: 12, fontStyle: "italic", color: colors.charcoal, marginBottom: 10 },
  historyBtnRow: { flexDirection: "row", gap: 8 },
  halfBtn: { flex: 1 },
});
