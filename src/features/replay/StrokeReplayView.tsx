import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";
import { extractStrokeEvents, persistProjectReplay, reconstructStrokesUpTo } from "./StrokeReplayEngine";
import type { Stroke, StrokeEvent } from "../../domain/types";

export const StrokeReplayView: React.FC = () => {
  const currentProject = useAppStore((state) => state.currentProject);
  const [events, setEvents] = useState<StrokeEvent[]>([]);
  const [currentEventIdx, setCurrentEventIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1 | 2 | 5>(1);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentProject) {
      const evs = extractStrokeEvents(currentProject);
      setEvents(evs);
      setCurrentEventIdx(evs.length - 1);
      void persistProjectReplay(currentProject);
    }
  }, [currentProject]);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(10, Math.round(30 / speed));
      animationRef.current = setInterval(() => {
        setCurrentEventIdx((prev) => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isPlaying, speed, events.length]);

  const activeStrokes = reconstructStrokesUpTo(events, currentEventIdx);

  const handleTogglePlay = () => {
    if (currentEventIdx >= events.length - 1) {
      setCurrentEventIdx(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentEventIdx(0);
  };

  if (!currentProject) {
    return (
      <Screen>
        <AppHeader title="Smart Stroke Replay" onBack={() => router.back()} />
        <InfoCard style={{ padding: 20 }}>
          <Text style={{ fontSize: 14, color: colors.charcoal, textAlign: "center" }}>
            Open a drawing project first to watch its stroke timelapse replay.
          </Text>
          <Button title="Open Projects" icon="▧" onPress={() => router.push("/projects")} style={{ marginTop: 12 }} />
        </InfoCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Smart Stroke Replay" onBack={() => router.back()} />
      <Eyebrow>PROCESS TIMELAPSE & STEP SCRUBBER</Eyebrow>
      <Text style={styles.title}>Stroke Replay<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Reconstruct drawing process stroke-by-stroke with chronological accuracy and variable playback speeds.
      </Text>

      {/* Skia Replay Canvas */}
      <View style={styles.canvasContainer}>
        <Canvas style={{ width: "100%", height: 380, backgroundColor: "#FAF7EE" }}>
          {activeStrokes.map((s) => {
            const builder = Skia.PathBuilder.Make();
            if (s.points.length > 0) {
              const scale = 380 / 1400; // fit canvas
              builder.moveTo(s.points[0]!.x * scale, s.points[0]!.y * scale);
              for (let i = 1; i < s.points.length; i++) {
                builder.lineTo(s.points[i]!.x * scale, s.points[i]!.y * scale);
              }
            }
            const p = builder.build();
            return (
              <Path
                key={s.id}
                path={p}
                color={s.color}
                style="stroke"
                strokeWidth={Math.max(1, s.width * 0.35)}
                strokeCap="round"
                strokeJoin="round"
              />
            );
          })}
        </Canvas>
      </View>

      {/* Controls Card */}
      <InfoCard style={styles.controlsCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Point {currentEventIdx + 1} of {events.length} ({Math.round(((currentEventIdx + 1) / Math.max(1, events.length)) * 100)}%)
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <Button
            title={isPlaying ? "Pause" : "Play Timelapse"}
            icon={isPlaying ? "⏸" : "▶"}
            onPress={handleTogglePlay}
            style={styles.actionBtn}
          />
          <Button
            title="Restart"
            icon="↺"
            tone="line"
            onPress={handleRestart}
            style={styles.actionBtn}
          />
        </View>

        {/* Speed Controls */}
        <Text style={styles.speedLabel}>Playback Speed:</Text>
        <View style={styles.speedRow}>
          {([0.5, 1, 2, 5] as const).map((s) => (
            <Pressable
              key={`speed-${s}`}
              onPress={() => setSpeed(s)}
              style={[styles.speedPill, speed === s && styles.speedPillActive]}
            >
              <Text style={[styles.speedPillText, speed === s && styles.speedPillTextActive]}>{s}x</Text>
            </Pressable>
          ))}
        </View>
      </InfoCard>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "700", color: colors.charcoal, marginTop: 4, marginBottom: 4 },
  titleDot: { color: colors.terracotta },
  note: { fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: 14 },
  canvasContainer: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DCD5C5",
    marginBottom: 14,
  },
  controlsCard: { padding: 16 },
  progressRow: { alignItems: "center", marginBottom: 12 },
  progressText: { fontSize: 12, fontWeight: "600", color: colors.charcoal },
  btnRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  actionBtn: { flex: 1 },
  speedLabel: { fontSize: 12, fontWeight: "600", color: colors.inkMuted, marginBottom: 6 },
  speedRow: { flexDirection: "row", gap: 8 },
  speedPill: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 12, backgroundColor: "#EBE5D8" },
  speedPillActive: { backgroundColor: colors.forest },
  speedPillText: { fontSize: 12, fontWeight: "700", color: colors.charcoal },
  speedPillTextActive: { color: "#FFFFFF" },
});
