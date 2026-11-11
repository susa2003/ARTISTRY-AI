/**
 * ARTISTRY AI — Mode Selector Modal
 * Polished modal allowing users to switch between Beginner and Professional experience modes
 * at any time with clear explanations, preservation guarantees, and visual distinction.
 */

import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ExperienceMode } from "./types";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";

interface ModeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMode?: (mode: ExperienceMode) => void;
}

export function ModeSelectorModal({ visible, onClose, onSelectMode }: ModeSelectorModalProps) {
  const experienceMode = useAppStore((state) => state.experienceMode);
  const setExperienceMode = useAppStore((state) => state.setExperienceMode);

  const handleSelect = async (mode: ExperienceMode) => {
    await setExperienceMode(mode);
    onSelectMode?.(mode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Experience Mode</Text>
              <Text style={styles.subtitle}>Choose your preferred drawing workflow</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityLabel="Close mode selector"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Beginner Mode Card */}
            <Pressable
              onPress={() => void handleSelect("beginner")}
              style={({ pressed }) => [
                styles.modeCard,
                experienceMode === "beginner" && styles.modeCardActiveBeginner,
                pressed && styles.pressed,
              ]}
              accessibilityLabel="Select Beginner Mode"
            >
              <View style={styles.modeCardHeader}>
                <View style={[styles.modeIconCircle, { backgroundColor: "#1C2B22" }]}>
                  <Text style={styles.modeIcon}>🌱</Text>
                </View>
                <View style={styles.modeTitleGroup}>
                  <View style={styles.modeTitleRow}>
                    <Text style={styles.modeTitle}>Beginner Mode</Text>
                    {experienceMode === "beginner" && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.modeSubtitle}>Learn Drawing Step by Step.</Text>
                </View>
              </View>

              <Text style={styles.modeDesc}>
                A guided drawing experience for people starting from zero.
              </Text>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureDot}>✓</Text>
                  <Text style={styles.featureText}>7-level structured curriculum (39 lessons from fundamentals to portraits)</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureDot}>✓</Text>
                  <Text style={styles.featureText}>Step-by-step visual instructions with restart and progress controls</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureDot}>✓</Text>
                  <Text style={styles.featureText}>Contextual coach tips and simplified Reference Studio guides</Text>
                </View>
              </View>
            </Pressable>

            {/* Professional Mode Card */}
            <Pressable
              onPress={() => void handleSelect("professional")}
              style={({ pressed }) => [
                styles.modeCard,
                experienceMode === "professional" && styles.modeCardActivePro,
                pressed && styles.pressed,
              ]}
              accessibilityLabel="Select Professional Mode"
            >
              <View style={styles.modeCardHeader}>
                <View style={[styles.modeIconCircle, { backgroundColor: "#2D261A" }]}>
                  <Text style={styles.modeIcon}>⚡</Text>
                </View>
                <View style={styles.modeTitleGroup}>
                  <View style={styles.modeTitleRow}>
                    <Text style={styles.modeTitle}>Professional Mode</Text>
                    {experienceMode === "professional" && (
                      <View style={[styles.activeBadge, { backgroundColor: "#D5A844" }]}>
                        <Text style={[styles.activeBadgeText, { color: "#121513" }]}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.modeSubtitle}>Complete Traditional Artist Workstation.</Text>
                </View>
              </View>

              <Text style={styles.modeDesc}>
                Advanced drawing tools and independent control over every construction method.
              </Text>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureDot, { color: "#D5A844" }]}>✓</Text>
                  <Text style={styles.featureText}>All 9 multi-overlay drawing methods (Loomis, Reilly, Bargue, Perspective, Anatomy, Shading)</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureDot, { color: "#D5A844" }]}>✓</Text>
                  <Text style={styles.featureText}>Independent layer zIndex ordering, opacity pills, and locking</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureDot, { color: "#D5A844" }]}>✓</Text>
                  <Text style={styles.featureText}>Hardware whiteout shader, metric mm paper scaling, and full parameter dials</Text>
                </View>
              </View>
            </Pressable>

            {/* Preservation Guarantee Note */}
            <View style={styles.guaranteeBox}>
              <Text style={styles.guaranteeIcon}>🔒</Text>
              <Text style={styles.guaranteeText}>
                Your projects, layers, references, and lesson progress are 100% preserved when switching modes. Both modes share the same graphics engine.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    backgroundColor: "#181D1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#2B342E",
    maxHeight: "85%",
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#262F29",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F3EC",
  },
  subtitle: {
    fontSize: 12,
    color: "#8B958D",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#242D26",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#DCD9D0",
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modeCard: {
    backgroundColor: "#202723",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#2C362F",
    marginBottom: 14,
    gap: 10,
  },
  modeCardActiveBeginner: {
    borderColor: "#28594B",
    backgroundColor: "#19261F",
  },
  modeCardActivePro: {
    borderColor: "#D5A844",
    backgroundColor: "#242017",
  },
  modeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modeIcon: {
    fontSize: 22,
  },
  modeTitleGroup: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F5F3EC",
  },
  activeBadge: {
    backgroundColor: "#28594B",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#E2F0E7",
    letterSpacing: 0.5,
  },
  modeSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ACB8AE",
    marginTop: 2,
  },
  modeDesc: {
    fontSize: 13,
    color: "#D0D9D2",
    lineHeight: 18,
  },
  featureList: {
    gap: 6,
    marginTop: 2,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  featureDot: {
    fontSize: 12,
    color: "#4E9B7B",
    fontWeight: "700",
    marginTop: 1,
  },
  featureText: {
    fontSize: 12,
    color: "#8E9A90",
    flex: 1,
    lineHeight: 16,
  },
  guaranteeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1C221E",
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#263029",
  },
  guaranteeIcon: {
    fontSize: 16,
  },
  guaranteeText: {
    fontSize: 11,
    color: "#7E8B81",
    lineHeight: 16,
    flex: 1,
  },
});
