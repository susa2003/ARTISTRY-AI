/**
 * ARTISTRY AI — Beginner Mode Coach Strip
 * Contextual guidance component mounted in Reference Studio for beginners:
 * - Actionable prompt tips ("Start with Grid", "Try Loomis", "Adjust brightness")
 * - Educational explanations of active drawing methods
 * - Non-intrusive collapsible strip preserving full canvas space
 */

import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { OverlayType, UnifiedOverlay } from "../../domain/overlayTypes";

interface BeginnerCoachStripProps {
  activeOverlays: UnifiedOverlay[];
  onAddOverlay: (type: OverlayType) => void;
  onOpenAdjustments: () => void;
  onOpenHelp: (topic: string) => void;
}

const COACH_TIPS: Array<{
  id: string;
  label: string;
  icon: string;
  actionType: "overlay" | "adjustments" | "info";
  overlayType?: OverlayType;
  explanation: string;
}> = [
  {
    id: "tip-grid",
    label: "Start with Grid Drawing",
    icon: "⌗",
    actionType: "overlay",
    overlayType: "grid",
    explanation: "A grid breaks down complex subjects into simple cells. Draw cell by cell to prevent distortion.",
  },
  {
    id: "tip-loomis",
    label: "Try Loomis Head Guide",
    icon: "⨁",
    actionType: "overlay",
    overlayType: "loomis",
    explanation: "Andrew Loomis's cranial sphere and facial thirds give portraits immediate 3D head rotation.",
  },
  {
    id: "tip-brightness",
    label: "Adjust Image Brightness",
    icon: "🎛️",
    actionType: "adjustments",
    explanation: "Fading your photo with the Whiteout shader makes your pencil and construction lines pop clearly.",
  },
  {
    id: "tip-tracing",
    label: "Use Tracing for Contours",
    icon: "◻",
    actionType: "overlay",
    overlayType: "tracing",
    explanation: "Tracing helps you study how master contours flow. Observe where lines curve rather than blindly copying.",
  },
  {
    id: "tip-shading",
    label: "Try 5-Value Shading",
    icon: "◑",
    actionType: "overlay",
    overlayType: "shading",
    explanation: "Identify the light source and separate light planes from shadow planes along the crisp terminator line.",
  },
  {
    id: "tip-plumb",
    label: "Check Plumb Alignment",
    icon: "┼",
    actionType: "overlay",
    overlayType: "plumb",
    explanation: "Vertical plumb lines check whether eyes, nose, and chin align correctly under gravity.",
  },
];

export function BeginnerCoachStrip({
  activeOverlays,
  onAddOverlay,
  onOpenAdjustments,
  onOpenHelp,
}: BeginnerCoachStripProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Strip Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.coachDot}>🌱</Text>
          <Text style={styles.coachTitle}>BEGINNER DRAWING COACH</Text>
        </View>

        <Pressable
          onPress={() => setCollapsed(!collapsed)}
          style={styles.collapseBtn}
        >
          <Text style={styles.collapseBtnText}>{collapsed ? "Show Tips ▼" : "Hide ▲"}</Text>
        </Pressable>
      </View>

      {!collapsed && (
        <>
          {/* Quick Guidance Actions Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {COACH_TIPS.map((tip) => {
              const isAlreadyActive = tip.overlayType
                ? activeOverlays.some((o) => o.type === tip.overlayType && o.visible)
                : false;

              return (
                <Pressable
                  key={tip.id}
                  onPress={() => {
                    if (tip.actionType === "adjustments") {
                      onOpenAdjustments();
                    } else if (tip.actionType === "overlay" && tip.overlayType) {
                      onAddOverlay(tip.overlayType);
                    }
                    setActiveInfo(tip.explanation);
                  }}
                  style={({ pressed }) => [
                    styles.pill,
                    isAlreadyActive && styles.pillActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.pillIcon}>{tip.icon}</Text>
                  <Text style={[styles.pillText, isAlreadyActive && styles.pillTextActive]}>
                    {tip.label}
                  </Text>
                  {isAlreadyActive && <Text style={styles.activeCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Contextual Tip Callout (if selected) */}
          {activeInfo ? (
            <View style={styles.calloutBox}>
              <Text style={styles.calloutText}>{activeInfo}</Text>
              <Pressable onPress={() => setActiveInfo(null)} style={styles.calloutClose}>
                <Text style={styles.calloutCloseText}>✕</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#161D19",
    borderBottomWidth: 1,
    borderBottomColor: "#25332A",
    paddingVertical: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coachDot: {
    fontSize: 12,
  },
  coachTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6CD498",
    letterSpacing: 0.5,
  },
  collapseBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  collapseBtnText: {
    fontSize: 10,
    color: "#7E8E83",
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E2A23",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#293B30",
  },
  pillActive: {
    backgroundColor: "#203A2B",
    borderColor: "#305A42",
  },
  pressed: {
    opacity: 0.8,
  },
  pillIcon: {
    fontSize: 12,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D0DCD3",
  },
  pillTextActive: {
    color: "#6CD498",
  },
  activeCheck: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6CD498",
    marginLeft: 2,
  },
  calloutBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1B2420",
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#28594B",
  },
  calloutText: {
    fontSize: 12,
    color: "#C2CEC6",
    flex: 1,
    lineHeight: 16,
  },
  calloutClose: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  calloutCloseText: {
    fontSize: 12,
    color: "#7E8E83",
  },
});
