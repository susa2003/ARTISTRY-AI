/**
 * ARTISTRY AI — Professional Mode Control Panel
 * Advanced collapsible telemetry and parameter dials for professional artists:
 * - Direct fine-tuning of Loomis 3D yaw, pitch, roll, and stages (1 to 8)
 * - Perspective assistant vanishing point positioning and ray density
 * - Directional light dial azimuth and elevation sliders
 * - Grid modes, division counts, and physical millimetre spacing
 * - Space-efficient collapsible floating HUD keeping reference canvas primary
 */

import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import type {
  GridOverlayConfig,
  LoomisOverlayConfig,
  PerspectiveOverlayConfig,
  ShadingOverlayConfig,
  UnifiedOverlay,
} from "../../domain/overlayTypes";
import { useResponsiveLayout } from "../../components/AppUI";

interface ProfessionalControlPanelProps {
  visible: boolean;
  onClose: () => void;
  overlays: UnifiedOverlay[];
  onUpdateOverlay: (overlay: UnifiedOverlay) => void;
}

export function ProfessionalControlPanel({
  visible,
  onClose,
  overlays,
  onUpdateOverlay,
}: ProfessionalControlPanelProps) {
  const layout = useResponsiveLayout();
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  const activeOverlay = overlays.find((o) => o.id === selectedOverlayId) ?? overlays[0];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              maxWidth: typeof layout.contentMaxWidth === "number" ? Math.min(layout.contentMaxWidth, 640) : "100%",
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO WORKSTATION</Text>
              </View>
              <Text style={styles.title}>Advanced Telemetry & Dials</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityLabel="Close control panel"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Studio Tools Bar */}
          <View style={[styles.quickToolsRow, layout.isSmallPhone && { flexDirection: "column" }]}>
            <Pressable
              onPress={() => {
                onClose();
                router.push("/assistant/index" as any);
              }}
              style={({ pressed }) => [styles.quickToolBtn, pressed && styles.pressed]}
              accessibilityLabel="Open AI Assistant"
            >
              <Text style={styles.quickToolBtnText}>🤖 AI Reference Analysis</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onClose();
                router.push("/comparison/index" as any);
              }}
              style={({ pressed }) => [styles.quickToolBtn, pressed && styles.pressed]}
              accessibilityLabel="Open Drawing Comparison"
            >
              <Text style={styles.quickToolBtnText}>⚖️ Drawing Comparison</Text>
            </Pressable>
          </View>

          {/* Active Overlay Selector Tabs */}
          {overlays.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabScroll}
              contentContainerStyle={styles.tabScrollContent}
            >
              {overlays.map((layer) => {
                const isSelected = activeOverlay?.id === layer.id;
                return (
                  <Pressable
                    key={layer.id}
                    onPress={() => setSelectedOverlayId(layer.id)}
                    style={[styles.tabPill, isSelected && styles.tabPillActive]}
                  >
                    <Text style={[styles.tabPillText, isSelected && styles.tabPillTextActive]}>
                      {layer.name || layer.type.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {/* Controls Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {!activeOverlay ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>⚡</Text>
                <Text style={styles.emptyTitle}>No Active Overlays</Text>
                <Text style={styles.emptyText}>
                  Add an overlay from the Layer Drawer (such as Loomis, Perspective, or Shading) to fine-tune its parametric controls here.
                </Text>
              </View>
            ) : null}

            {/* LOOMIS 3D HEAD CONTROLS */}
            {activeOverlay && activeOverlay.type === "loomis" ? (
              <LoomisProControls
                overlay={activeOverlay as LoomisOverlayConfig}
                onChange={onUpdateOverlay}
              />
            ) : null}

            {/* PERSPECTIVE CONTROLS */}
            {activeOverlay && activeOverlay.type === "perspective" ? (
              <PerspectiveProControls
                overlay={activeOverlay as PerspectiveOverlayConfig}
                onChange={onUpdateOverlay}
              />
            ) : null}

            {/* 5-VALUE SHADING CONTROLS */}
            {activeOverlay && activeOverlay.type === "shading" ? (
              <ShadingProControls
                overlay={activeOverlay as ShadingOverlayConfig}
                onChange={onUpdateOverlay}
              />
            ) : null}

            {/* GRID CONTROLS */}
            {activeOverlay && activeOverlay.type === "grid" ? (
              <GridProControls
                overlay={activeOverlay as GridOverlayConfig}
                onChange={onUpdateOverlay}
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// 1. Loomis Parametric Telemetry
// ---------------------------------------------------------------------------
function LoomisProControls({
  overlay,
  onChange,
}: {
  overlay: LoomisOverlayConfig;
  onChange: (o: UnifiedOverlay) => void;
}) {
  return (
    <View style={styles.controlGroup}>
      <Text style={styles.groupHeading}>Loomis 3D Head Construction</Text>

      {/* Progressive Stage Selector 1-8 */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Construction Stage</Text>
          <Text style={styles.paramValue}>Stage {overlay.stage} of 8</Text>
        </View>
        <View style={styles.stageGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <Pressable
              key={s}
              onPress={() => onChange({ ...overlay, stage: s })}
              style={[styles.stageBtn, overlay.stage === s && styles.stageBtnActive]}
            >
              <Text style={[styles.stageBtnText, overlay.stage === s && styles.stageBtnTextActive]}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Yaw Rotation (-45 to +45) */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Yaw (Head Turn)</Text>
          <Text style={styles.paramValue}>{overlay.yaw}°</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {[-30, -15, 0, 15, 30].map((deg) => (
            <Pressable
              key={deg}
              onPress={() => onChange({ ...overlay, yaw: deg })}
              style={[styles.stepBtn, overlay.yaw === deg && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, overlay.yaw === deg && styles.stepBtnTextActive]}>
                {deg > 0 ? `+${deg}°` : `${deg}°`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Pitch Tilt (-30 to +30) */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Pitch (Head Tilt)</Text>
          <Text style={styles.paramValue}>{overlay.pitch}°</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {[-20, -10, 0, 10, 20].map((deg) => (
            <Pressable
              key={deg}
              onPress={() => onChange({ ...overlay, pitch: deg })}
              style={[styles.stepBtn, overlay.pitch === deg && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, overlay.pitch === deg && styles.stepBtnTextActive]}>
                {deg > 0 ? `+${deg}°` : `${deg}°`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Jaw Length Multiplier */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Jaw Length Multiplier</Text>
          <Text style={styles.paramValue}>{overlay.jawLength.toFixed(2)}x</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {[0.85, 1.0, 1.15, 1.3].map((val) => (
            <Pressable
              key={val}
              onPress={() => onChange({ ...overlay, jawLength: val })}
              style={[styles.stepBtn, Math.abs(overlay.jawLength - val) < 0.05 && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, Math.abs(overlay.jawLength - val) < 0.05 && styles.stepBtnTextActive]}>
                {val}x
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. Perspective Telemetry
// ---------------------------------------------------------------------------
function PerspectiveProControls({
  overlay,
  onChange,
}: {
  overlay: PerspectiveOverlayConfig;
  onChange: (o: UnifiedOverlay) => void;
}) {
  return (
    <View style={styles.controlGroup}>
      <Text style={styles.groupHeading}>Linear Perspective Assistant</Text>

      {/* Mode Selector */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Perspective Mode</Text>
          <Text style={styles.paramValue}>{overlay.mode.toUpperCase()}</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {(["1-point", "2-point", "3-point"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => onChange({ ...overlay, mode: m })}
              style={[styles.stepBtn, overlay.mode === m && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, overlay.mode === m && styles.stepBtnTextActive]}>
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Horizon Line Y */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Horizon / Eye Level</Text>
          <Text style={styles.paramValue}>{Math.round(overlay.horizonY * 100)}%</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {[0.3, 0.4, 0.5, 0.6, 0.7].map((h) => (
            <Pressable
              key={h}
              onPress={() => onChange({ ...overlay, horizonY: h })}
              style={[styles.stepBtn, Math.abs(overlay.horizonY - h) < 0.04 && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, Math.abs(overlay.horizonY - h) < 0.04 && styles.stepBtnTextActive]}>
                {Math.round(h * 100)}%
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Ray Count */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Orthogonal Ray Density</Text>
          <Text style={styles.paramValue}>{overlay.rayCount} rays</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {[6, 8, 10, 14, 18].map((c) => (
            <Pressable
              key={c}
              onPress={() => onChange({ ...overlay, rayCount: c })}
              style={[styles.stepBtn, overlay.rayCount === c && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, overlay.rayCount === c && styles.stepBtnTextActive]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. Shading Telemetry
// ---------------------------------------------------------------------------
function ShadingProControls({
  overlay,
  onChange,
}: {
  overlay: ShadingOverlayConfig;
  onChange: (o: UnifiedOverlay) => void;
}) {
  return (
    <View style={styles.controlGroup}>
      <Text style={styles.groupHeading}>5-Value Shading & Directional Lighting</Text>

      {/* Light Azimuth Angle */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>3D Light Angle (Azimuth)</Text>
          <Text style={styles.paramValue}>{overlay.lightAngle}°</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
            <Pressable
              key={ang}
              onPress={() => onChange({ ...overlay, lightAngle: ang })}
              style={[styles.stepBtn, overlay.lightAngle === ang && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, overlay.lightAngle === ang && styles.stepBtnTextActive]}>
                {ang}°
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Value Steps */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Tonal Value System</Text>
          <Text style={styles.paramValue}>{overlay.valueSteps}-Value Scale</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {[3, 5].map((steps) => (
            <Pressable
              key={steps}
              onPress={() => onChange({ ...overlay, valueSteps: steps as 3 | 5 })}
              style={[styles.stepBtn, overlay.valueSteps === steps && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, overlay.valueSteps === steps && styles.stepBtnTextActive]}>
                {steps === 3 ? "3-Value Study (Poster)" : "5-Value Classical Scale"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Terminator & Ray Toggles */}
      <View style={styles.paramCard}>
        <Text style={styles.paramLabel}>Display Toggles</Text>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => onChange({ ...overlay, showTerminator: !overlay.showTerminator })}
            style={[styles.toggleBtn, overlay.showTerminator && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleBtnText, overlay.showTerminator && styles.toggleBtnTextActive]}>
              {overlay.showTerminator ? "✓ Terminator Curve" : "✕ Terminator Curve"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onChange({ ...overlay, showLightRay: !overlay.showLightRay })}
            style={[styles.toggleBtn, overlay.showLightRay && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleBtnText, overlay.showLightRay && styles.toggleBtnTextActive]}>
              {overlay.showLightRay ? "✓ Light Vector" : "✕ Light Vector"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. Grid Telemetry
// ---------------------------------------------------------------------------
function GridProControls({
  overlay,
  onChange,
}: {
  overlay: GridOverlayConfig;
  onChange: (o: UnifiedOverlay) => void;
}) {
  return (
    <View style={styles.controlGroup}>
      <Text style={styles.groupHeading}>Proportional & Metric Grid Telemetry</Text>

      {/* Mode Selector */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Grid Mode</Text>
          <Text style={styles.paramValue}>{overlay.mode.toUpperCase()}</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {(["standard", "diagonals", "thirds", "golden"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => onChange({ ...overlay, mode: m })}
              style={[styles.stepBtn, overlay.mode === m && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, overlay.mode === m && styles.stepBtnTextActive]}>
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Divisions */}
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Text style={styles.paramLabel}>Divisions</Text>
          <Text style={styles.paramValue}>{overlay.divisions} x {overlay.divisions}</Text>
        </View>
        <View style={styles.stepBtnRow}>
          {[2, 3, 4, 6, 8, 10].map((d) => (
            <Pressable
              key={d}
              onPress={() => onChange({ ...overlay, divisions: d })}
              style={[styles.stepBtn, overlay.divisions === d && styles.stepBtnActive]}
            >
              <Text style={[styles.stepBtnText, overlay.divisions === d && styles.stepBtnTextActive]}>
                {d}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 13, 11, 0.72)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#161B18",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#28342D",
    maxHeight: "80%",
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#242E28",
  },
  headerTitleGroup: {
    gap: 3,
  },
  proBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#332918",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#574421",
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#E2B855",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F6F5EE",
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#222B25",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#D4DDD6",
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
  quickToolsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222C26",
  },
  quickToolBtn: {
    flex: 1,
    backgroundColor: "#1F2923",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2B3C31",
    alignItems: "center",
  },
  quickToolBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B2C5B9",
  },
  tabScroll: {
    maxHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: "#222C26",
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  tabPill: {
    backgroundColor: "#1E2722",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#28352D",
  },
  tabPillActive: {
    backgroundColor: "#332A17",
    borderColor: "#5C4A25",
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8B9A90",
  },
  tabPillTextActive: {
    color: "#E2B855",
    fontWeight: "700",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    paddingBottom: 30,
  },
  emptyCard: {
    backgroundColor: "#1C2420",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E2ECE5",
  },
  emptyText: {
    fontSize: 12,
    color: "#7E8E83",
    textAlign: "center",
    lineHeight: 17,
  },
  controlGroup: {
    gap: 12,
  },
  groupHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E2ECE5",
    marginBottom: 2,
  },
  paramCard: {
    backgroundColor: "#1D2520",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#29362E",
    gap: 10,
  },
  paramHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paramLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A2B2A7",
  },
  paramValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E2B855",
  },
  stageGrid: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  stageBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#242E28",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2E3B33",
  },
  stageBtnActive: {
    backgroundColor: "#D5A844",
    borderColor: "#E5BB57",
  },
  stageBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D0DCD3",
  },
  stageBtnTextActive: {
    color: "#121614",
  },
  stepBtnRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#242E28",
    borderWidth: 1,
    borderColor: "#2E3B33",
  },
  stepBtnActive: {
    backgroundColor: "#332A17",
    borderColor: "#5C4A25",
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D0DCD3",
  },
  stepBtnTextActive: {
    color: "#E2B855",
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#222B25",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2B372F",
  },
  toggleBtnActive: {
    backgroundColor: "#203628",
    borderColor: "#30553E",
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7E8E83",
  },
  toggleBtnTextActive: {
    color: "#6CD498",
    fontWeight: "700",
  },
});
