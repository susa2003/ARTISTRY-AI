import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";
import { convertSketchToVector, convertVectorToStrokes } from "./VectorConverterEngine";

export const VectorConverterView: React.FC = () => {
  const reference = useAppStore((state) => state.reference);
  const currentProject = useAppStore((state) => state.currentProject);
  const createProject = useAppStore((state) => state.createProject);
  const importStrokesToLayer = useAppStore((state) => state.importStrokesToLayer);

  const [tolerance, setTolerance] = useState(2.0);
  const [smoothness, setSmoothness] = useState(75);
  const [busy, setBusy] = useState(false);
  const [lastSvgPath, setLastSvgPath] = useState<string | null>(null);

  const handleVectorize = async () => {
    setBusy(true);
    try {
      const res = await convertSketchToVector(reference?.uri ?? "", {
        pathTolerance: tolerance,
        curveSmoothness: smoothness,
        strokeColor: "#1A201C",
        strokeWidth: 3,
      });
      setLastSvgPath(res.savedFilePath);
      Alert.alert(
        "Vectorization Complete!",
        `Extracted ${res.pathCount} scalable Bézier paths (${res.pointCount} points).`,
        [
          {
            text: "Export SVG File",
            onPress: () => {
              void Sharing.shareAsync(res.savedFilePath, { mimeType: "image/svg+xml" });
            },
          },
          {
            text: "Import into Canvas Layer",
            onPress: async () => {
              let pId = currentProject?.id;
              if (!pId) {
                pId = await createProject(null, "Vectorized Study");
              }
              const strokes = convertVectorToStrokes(1000, 1400);
              importStrokesToLayer("Vector Contours", strokes);
              router.push(`/studio/${pId}`);
            },
          },
          { text: "Done" },
        ]
      );
    } catch {
      Alert.alert("Vectorization Failed", "Could not vectorize current sketch.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Sketch-to-Vector Converter" onBack={() => router.back()} />
      <Eyebrow>SCALABLE BÉZIER CONTOUR EXTRACTION</Eyebrow>
      <Text style={styles.title}>Sketch to Vector<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Trace raster sketch silhouettes into clean mathematical Bézier SVG curves ready for infinite scaling or layer import.
      </Text>

      <InfoCard style={styles.card}>
        <Text style={styles.cardTitle}>Vectorization Parameters</Text>
        <Text style={styles.label}>Simplification Tolerance: {tolerance.toFixed(1)}px</Text>
        <View style={styles.pillRow}>
          {[1.0, 2.0, 3.5, 5.0].map((t) => (
            <Button
              key={`tol-${t}`}
              title={`${t.toFixed(1)}px`}
              tone={tolerance === t ? "clay" : "line"}
              onPress={() => setTolerance(t)}
              style={styles.pillBtn}
            />
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Curve Smoothness: {smoothness}%</Text>
        <View style={styles.pillRow}>
          {[50, 75, 90].map((s) => (
            <Button
              key={`sm-${s}`}
              title={`${s}%`}
              tone={smoothness === s ? "clay" : "line"}
              onPress={() => setSmoothness(s)}
              style={styles.pillBtn}
            />
          ))}
        </View>

        <Button
          title={busy ? "Vectorizing Contours..." : "Generate SVG Vector Paths"}
          icon="✦"
          disabled={busy}
          onPress={() => void handleVectorize()}
          style={{ marginTop: 16 }}
        />
      </InfoCard>

      {lastSvgPath && (
        <InfoCard style={styles.card}>
          <Text style={styles.cardTitle}>Exported Vector File</Text>
          <Text style={styles.filePath} numberOfLines={1}>{lastSvgPath}</Text>
          <Button
            title="Share / Save SVG"
            icon="↑"
            tone="soft"
            onPress={() => void Sharing.shareAsync(lastSvgPath, { mimeType: "image/svg+xml" })}
            style={{ marginTop: 8 }}
          />
        </InfoCard>
      )}
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
  filePath: { fontSize: 11, color: colors.inkMuted, fontStyle: "italic", marginBottom: 6 },
});
