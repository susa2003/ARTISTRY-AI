import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";
import {
  fetchSavedPalettes,
  generateColorRecommendations,
  persistPalette,
  removePalette,
} from "./ColorRecommendationEngine";
import type { SavedPaletteRecord } from "../../domain/types";
import type { ColorPaletteRecommendation } from "../../services/ai/types";

export const ColorRecommendationView: React.FC = () => {
  const setColor = useAppStore((state) => state.setColor);
  const [rec, setRec] = useState<ColorPaletteRecommendation | null>(null);
  const [savedPalettes, setSavedPalettes] = useState<SavedPaletteRecord[]>([]);

  const defaultBaseHexes = ["#7C5D43", "#D9822B", "#3A506B", "#8C5383", "#2C3E50"];

  const loadData = async () => {
    const r = await generateColorRecommendations(defaultBaseHexes);
    setRec(r);
    const saved = await fetchSavedPalettes();
    setSavedPalettes(saved);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleApplyColor = (hex: string) => {
    setColor(hex);
    Alert.alert("Brush Color Updated", `Selected ${hex} as your active canvas drawing color.`);
  };

  const handleSavePalette = async (name: string, paletteColors: string[]) => {
    await persistPalette(name, paletteColors);
    await loadData();
    Alert.alert("Palette Saved", `"${name}" saved to your local palette library.`);
  };

  if (!rec) {
    return (
      <Screen>
        <AppHeader title="AI Color Recommender" onBack={() => router.back()} />
        <Text style={{ marginTop: 24, textAlign: "center", color: colors.inkMuted }}>Computing harmonic palettes...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="AI Color Recommender" onBack={() => router.back()} />
      <Eyebrow>COLOR THEORY & HARMONIC SCHEMES</Eyebrow>
      <Text style={styles.title}>Color Recommender<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Construct balanced palettes using classical color harmony: complementary, analogous, triadic, and flesh-tone scales.
      </Text>

      {/* Dominant Swatches */}
      <InfoCard style={styles.card}>
        <Text style={styles.cardTitle}>Dominant Color Foundation</Text>
        <View style={styles.swatchRow}>
          {rec.dominantColors.map((hex, i) => (
            <Pressable key={`dom-${i}`} onPress={() => handleApplyColor(hex)} style={[styles.swatch, { backgroundColor: hex }]}>
              <Text style={styles.swatchHex}>{hex}</Text>
            </Pressable>
          ))}
        </View>
      </InfoCard>

      {/* Complementary Scheme */}
      <InfoCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Complementary (180° Contrast)</Text>
          <Pressable onPress={() => void handleSavePalette("Complementary", rec.palettes.complementary)} style={styles.savePill}>
            <Text style={styles.savePillText}>Save</Text>
          </Pressable>
        </View>
        <View style={styles.swatchRow}>
          {rec.palettes.complementary.map((hex, i) => (
            <Pressable key={`comp-${i}`} onPress={() => handleApplyColor(hex)} style={[styles.swatch, { backgroundColor: hex }]}>
              <Text style={styles.swatchHex}>{hex}</Text>
            </Pressable>
          ))}
        </View>
      </InfoCard>

      {/* Analogous Scheme */}
      <InfoCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Analogous (Adjacent Harmony)</Text>
          <Pressable onPress={() => void handleSavePalette("Analogous", rec.palettes.analogous)} style={styles.savePill}>
            <Text style={styles.savePillText}>Save</Text>
          </Pressable>
        </View>
        <View style={styles.swatchRow}>
          {rec.palettes.analogous.map((hex, i) => (
            <Pressable key={`ana-${i}`} onPress={() => handleApplyColor(hex)} style={[styles.swatch, { backgroundColor: hex }]}>
              <Text style={styles.swatchHex}>{hex}</Text>
            </Pressable>
          ))}
        </View>
      </InfoCard>

      {/* Skin Tones */}
      <InfoCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Academic Portrait & Skin Tones</Text>
          <Pressable onPress={() => void handleSavePalette("Skin Tones", rec.palettes.skinTones)} style={styles.savePill}>
            <Text style={styles.savePillText}>Save</Text>
          </Pressable>
        </View>
        <View style={styles.swatchRow}>
          {rec.palettes.skinTones.map((hex, i) => (
            <Pressable key={`skin-${i}`} onPress={() => handleApplyColor(hex)} style={[styles.swatch, { backgroundColor: hex }]}>
              <Text style={styles.swatchHex}>{hex}</Text>
            </Pressable>
          ))}
        </View>
      </InfoCard>

      {/* Saved Palettes */}
      {savedPalettes.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionHeading}>Saved Local Palettes ({savedPalettes.length})</Text>
          {savedPalettes.map((sp) => (
            <InfoCard key={sp.id} style={styles.savedCard}>
              <View style={styles.savedHeader}>
                <Text style={styles.savedTitle}>{sp.name}</Text>
                <Pressable
                  onPress={async () => {
                    await removePalette(sp.id);
                    void loadData();
                  }}
                >
                  <Text style={styles.delText}>Delete</Text>
                </Pressable>
              </View>
              <View style={styles.swatchRow}>
                {sp.colors.map((hex, i) => (
                  <Pressable key={`sp-${sp.id}-${i}`} onPress={() => handleApplyColor(hex)} style={[styles.swatch, { backgroundColor: hex }]}>
                    <Text style={styles.swatchHex}>{hex}</Text>
                  </Pressable>
                ))}
              </View>
            </InfoCard>
          ))}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "700", color: colors.charcoal, marginTop: 4, marginBottom: 4 },
  titleDot: { color: colors.terracotta },
  note: { fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: 14 },
  card: { padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: colors.charcoal },
  savePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: "#EDE7DA" },
  savePillText: { fontSize: 10, fontWeight: "700", color: colors.forest },
  swatchRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  swatch: { flex: 1, height: 48, borderRadius: 8, justifyContent: "flex-end", alignItems: "center", paddingBottom: 4 },
  swatchHex: { fontSize: 8, fontWeight: "700", color: "#FFFFFF", textShadowColor: "#00000088", textShadowRadius: 2 },
  sectionHeading: { fontSize: 14, fontWeight: "700", color: colors.charcoal, marginBottom: 8 },
  savedCard: { padding: 12, marginBottom: 10 },
  savedHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  savedTitle: { fontSize: 12, fontWeight: "700", color: colors.charcoal },
  delText: { fontSize: 11, color: colors.terracotta, fontWeight: "600" },
});
